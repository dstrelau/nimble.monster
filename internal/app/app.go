package app

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gofrs/uuid"
	pgxuuid "github.com/jackc/pgx-gofrs-uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/joho/godotenv/autoload"
	"github.com/pgx-contrib/pgxotel"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/instr"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
)

type App struct {
	db       *sqldb.Queries
	router   *chi.Mux
	shutdown func(context.Context) error
	Port     int
}

func New() (*App, error) {
	ctx := context.Background()

	port := 8080
	if v, _ := strconv.Atoi(os.Getenv("PORT")); v > 0 {
		port = v
	}

	dbconfig, err := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	dbconfig.ConnConfig.Tracer = &pgxotel.QueryTracer{
		Name: "nimble.monster",
	}

	dbconfig.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		pgxuuid.Register(conn.TypeMap())
		return nil
	}
	pool, err := pgxpool.NewWithConfig(ctx, dbconfig)
	if err != nil {
		return nil, err
	}

	shutdownTracer, err := instr.InitTracer(ctx, "nimble-monster")
	if err != nil {
		return nil, err
	}

	shutdown := func(ctx context.Context) error {
		pool.Close()
		return shutdownTracer(ctx)
	}

	s := &App{
		Port:     port,
		db:       sqldb.New(pool),
		shutdown: shutdown,
	}

	s.buildRouter()
	return s, nil
}

func (a *App) Shutdown(ctx context.Context) error {
	return a.shutdown(ctx)
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.router.ServeHTTP(w, r)
}

func (a *App) buildRouter() {
	r := chi.NewRouter()

	r.Use(func(h http.Handler) http.Handler {
		return otelhttp.NewHandler(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				h.ServeHTTP(w, r)

				ctx := r.Context()
				routePattern := chi.RouteContext(ctx).RoutePattern()
				span := trace.SpanFromContext(ctx)
				if routePattern == "/*" {
					span.SetName(r.Method + " " + r.URL.Path)
				} else {
					span.SetName(r.Method + " " + routePattern)
				}
				span.SetAttributes(
					semconv.HTTPRoute(routePattern),
				)

				labeler, ok := otelhttp.LabelerFromContext(ctx)
				if ok {
					labeler.Add(semconv.HTTPRoute(routePattern))
				}
			}),
			"nimble.monster",
		)
	})

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(a.ProcessAuth)

	{
		h := NewSessionsHandler(a.db)
		r.Get("/auth/login", h.GetLogin)
		r.Post("/auth/logout", h.PostLogout)
		r.Get("/auth/discord", h.GetCallbackDiscord)
		r.Get("/api/users/me", h.GetCurrentUser)
	}

	{
		h := NewMonstersHandler(a.db)
		r.With(RequireAuth).Get("/api/users/me/monsters", h.ListMyMonsters)
		r.With(RequireAuth).Get("/api/monsters/{id}", h.GetMonster)
		r.With(RequireAuth).Put("/api/monsters/{id}", h.UpdateMonster)
		r.With(RequireAuth).Post("/api/monsters", h.CreateMonster)
		r.With(RequireAuth).Delete("/api/monsters/{id}", h.DeleteMonster)
	}

	{
		h := NewCollectionsHandler(a.db)
		r.With(RequireAuth).Get("/api/users/me/collections", h.ListMyCollections)
		r.With(RequireAuth).Post("/api/collections", h.CreateCollection)
		r.With(RequireAuth).Delete("/api/collections/{id}", h.DeleteCollection)
		r.With(RequireAuth).Put("/api/collections/{id}", h.UpdateCollection)
		r.With(RequireAuth).Put("/api/collections/{id}/monsters", h.UpdateCollectionMonsters)
		r.Get("/api/collections/{id}", h.GetCollection)
	}

	fs := http.FileServer(http.Dir("./dist/assets"))
	r.Handle("/assets/*", http.StripPrefix("/assets/", fs))

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./dist/index.html")
	})

	a.router = r
}

func Error(ctx context.Context, w http.ResponseWriter, err error) {
	trace.SpanFromContext(ctx).RecordError(err)
	http.Error(w, err.Error(), 500)
}

type currentUserCtxKey struct{}

func (a *App) ProcessAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		span := trace.SpanFromContext(r.Context())

		cookie, err := r.Cookie(sessionCookieName)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		sid, err := uuid.FromString(cookie.Value)
		if err != nil {
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}

		user, err := a.db.GetUserByUnexpiredSession(ctx, sid)
		if err != nil {
			http.SetCookie(w, &http.Cookie{
				Name:     sessionCookieName,
				Value:    "",
				Path:     "/",
				MaxAge:   -1,
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteLaxMode,
			})
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}

		span.SetAttributes(attribute.String("user.id", user.ID.String()))

		ctx = SetCurrentUser(ctx,
			nimble.User{
				ID:        user.ID,
				DiscordID: user.DiscordID,
				Username:  user.Username,
				Avatar:    user.Avatar.String,
			})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func SetCurrentUser(ctx context.Context, u nimble.User) context.Context {
	return context.WithValue(ctx, currentUserCtxKey{}, &u)
}

// might be nil!
func CurrentUser(ctx context.Context) *nimble.User {
	u, _ := ctx.Value(currentUserCtxKey{}).(*nimble.User)
	return u
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := CurrentUser(ctx)
		if user == nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *App) StartSessionCleanup(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	for {
		select {
		case <-ctx.Done():
			ticker.Stop()
			return
		case <-ticker.C:
			if err := a.db.CleanExpiredSessions(ctx); err != nil {
				log.Println(err)
			}
		}
	}
}

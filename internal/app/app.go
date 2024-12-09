package app

import (
	"context"
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
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/web"
	"nimble.monster/web/assets"
	"nimble.monster/web/layouts"
	"nimble.monster/web/pages"
)

type App struct {
	db       *sqldb.Queries
	router   *chi.Mux
	shutdown func(context.Context) error
	Port     int
}

func New() (*App, error) {
	ctx := context.Background()

	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		return nil, err
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
			// otelhttp.WithMeterProvider(meterProvider),
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

	r.Get("/", a.Home)

	{
		h := NewMonstersHandler(a.db)
		r.Get("/build", h.GetBuild)
		r.Post("/build", h.PostBuild)
		r.Post("/build/preview", h.PostBuildPreview)

		r.With(RequireAuth).Get("/my/monsters", h.GetMyMonsters)
		r.With(RequireAuth).Get("/my/monsters/{id}/edit", h.GetMyMonstersEdit)
		r.With(RequireAuth).Post("/my/monsters/{id}", h.UpdateMonster)
		r.With(RequireAuth).Delete("/my/monsters/{id}", h.DeleteMonster)
	}

	{
		h := NewSessionsHandler(a.db)
		r.Get("/login", h.GetLogin)
		r.Post("/logout", h.PostLogout)
		r.Get("/callback/discord", h.GetCallbackDiscord)
	}

	{
		h := NewCollectionsHandler(a.db)
		r.With(RequireAuth).Get("/my/collections", h.GetCollections)
		r.With(RequireAuth).Get("/my/collections/new", h.GetCollectionsNew)
		r.With(RequireAuth).Post("/my/collections", h.PostCollections)
		r.With(RequireAuth).Get("/my/collections/{id}", h.GetCollectionsID)
	}

	r.Get("/*", http.FileServer(http.FS(assets.FS)).ServeHTTP)
	a.router = r
}

func (a *App) Home(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vd := web.GlobalProps{
		CurrentUser: CurrentUser(ctx),
		CurrentURL:  r.URL,
		Title:       "Welcome",
	}
	layouts.Global(vd, pages.Home()).Render(ctx, w)
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

		user, err := a.db.GetUserByUnexpiredSessionID(ctx, sid)
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

		userID := uuid.UUID(user.ID.Bytes)
		span.SetAttributes(attribute.String("user.id", userID.String()))

		ctx = context.WithValue(ctx, currentUserCtxKey{}, &user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// might be nil!
func CurrentUser(ctx context.Context) *sqldb.User {
	u, _ := ctx.Value(currentUserCtxKey{}).(*sqldb.User)
	return u
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := CurrentUser(ctx)
		if user == nil {
			http.Redirect(w, r, "/login", http.StatusTemporaryRedirect)
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
				// Log error
			}
		}
	}
}

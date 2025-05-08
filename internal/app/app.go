package app

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-jose/go-jose/v4"
	pgxuuid "github.com/jackc/pgx-gofrs-uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/joho/godotenv/autoload"
	"github.com/pgx-contrib/pgxotel"
	"golang.org/x/crypto/hkdf"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
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
	if v, _ := strconv.Atoi(os.Getenv("API_PORT")); v > 0 {
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

	monsters := sqldb.NewMonsterStore(a.db)
	collections := sqldb.NewCollectionStore(a.db, monsters)

	{
		h := NewMonstersHandler(monsters)
		r.With(RequireAuth).Get("/api/users/me/monsters", h.ListMyMonsters)
		r.With(RequireAuth).Get("/api/monsters/{id}", h.GetMonster)
		r.With(RequireAuth).Put("/api/monsters/{id}", h.UpdateMonster)
		r.With(RequireAuth).Post("/api/monsters", h.CreateMonster)
		r.With(RequireAuth).Delete("/api/monsters/{id}", h.DeleteMonster)
		r.Get("/api/monsters", h.ListPublicMonsters)
	}
	{
		h := NewCollectionsHandler(collections)
		r.With(RequireAuth).Get("/api/users/me/collections", h.ListMyCollections)
		r.With(RequireAuth).Post("/api/collections", h.CreateCollection)
		r.With(RequireAuth).Delete("/api/collections/{id}", h.DeleteCollection)
		r.With(RequireAuth).Put("/api/collections/{id}", h.UpdateCollection)
		r.With(RequireAuth).Put("/api/collections/{id}/monsters", h.UpdateCollectionMonsters)
		r.Get("/api/collections/{id}", h.GetCollection)
		r.Get("/api/collections/{id}/download", h.DownloadCollection)
		r.Get("/api/collections", h.ListPublicCollections)
	}

	fs := http.FileServer(http.Dir("./dist/assets"))
	r.Handle("/assets/*", http.StripPrefix("/assets/", fs))

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./dist/index.html")
	})

	a.router = r
}

func Error(ctx context.Context, w http.ResponseWriter, err error) {
	if os.Getenv("DEBUG") != "" {
		fmt.Println(err)
	}
	trace.SpanFromContext(ctx).RecordError(err)
	w.WriteHeader(http.StatusInternalServerError)
}

func (a *App) ProcessAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		span := trace.SpanFromContext(r.Context())

		var cookie *http.Cookie
		var err error
		for _, c := range []string{"__Secure-authjs.session-token", "authjs.session-token"} {
			cookie, err = r.Cookie(c)
			if err == nil {
				break
			}
		}
		if err != nil {
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}

		authSecret := os.Getenv("AUTH_SECRET")
		if authSecret == "" {
			span.RecordError(errors.New("no AUTH_SECRET"))
			next.ServeHTTP(w, r)
			return
		}

		info := fmt.Appendf(nil, "Auth.js Generated Encryption Key (%s)", cookie.Name)
		kdf := hkdf.New(sha256.New, []byte(authSecret), []byte(cookie.Name), info)
		derivedKey := make([]byte, 64)
		if _, err := io.ReadFull(kdf, derivedKey); err != nil {
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}
		jwe, err := jose.ParseEncrypted(cookie.Value, []jose.KeyAlgorithm{jose.DIRECT}, []jose.ContentEncryption{jose.A256CBC_HS512})
		if err != nil {
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}

		decrypted, err := jwe.Decrypt(derivedKey)
		if err != nil {
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}

		var claims map[string]any
		if err := json.Unmarshal(decrypted, &claims); err != nil {
			span.RecordError(err)
			next.ServeHTTP(w, r)
			return
		}

		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				span.RecordError(errors.New("session expired"))
				next.ServeHTTP(w, r)
				return
			}
		}

		if iat, ok := claims["iat"].(float64); ok {
			if time.Now().Unix() < int64(iat/1000) {
				span.RecordError(errors.New("issued in future?"))
				next.ServeHTTP(w, r)
				return
			}
		}

		user, err := a.db.UpsertUser(ctx, sqldb.UpsertUserParams{
			DiscordID: claims["id"].(string),
			Username:  claims["name"].(string),
			Avatar:    pgtype.Text{String: claims["picture"].(string), Valid: true},
		})
		if err != nil {
			span.RecordError(err)
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		ctx = nimble.SetCurrentUser(ctx,
			nimble.User{
				ID:        nimble.UserID(user.ID),
				DiscordID: user.DiscordID,
				Username:  user.Username,
				Avatar:    user.Avatar.String,
			})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := nimble.CurrentUser(ctx)
		if user == nil {
			w.WriteHeader(http.StatusUnauthorized)
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

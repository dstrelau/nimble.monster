package app

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"slices"
	"strconv"

	"deedles.dev/xiter"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gofrs/uuid"
	pgxuuid "github.com/jackc/pgx-gofrs-uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/joho/godotenv/autoload"
	"golang.org/x/oauth2"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/instr"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/web"
	"nimble.monster/web/assets"
	"nimble.monster/web/components"
	"nimble.monster/web/layouts"
	"nimble.monster/web/pages"
)

var discordEnpdoint = oauth2.Endpoint{
	AuthURL:       "https://discord.com/api/oauth2/authorize",
	DeviceAuthURL: "https://discord.com/api/oauth2/device/code",
	TokenURL:      "https://discord.com/api/oauth2/token",
}

type App struct {
	db       *sqldb.Queries
	router   *chi.Mux
	o2       *oauth2.Config
	Port     int
	shutdown func(context.Context) error
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
		o2: &oauth2.Config{
			ClientID:     os.Getenv("DISCORD_CLIENT_ID"),
			ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("DISCORD_REDIRECT_URI"),
			Scopes:       []string{"identify"},
			Endpoint:     discordEnpdoint,
		},
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
				span.SetName(r.Method + " " + routePattern)
				span.SetAttributes(
					semconv.HTTPTarget(r.URL.String()),
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

	r.Use(a.SessionMiddleware)

	r.Get("/", a.Home)
	r.Get("/build", a.GetBuild)
	r.Post("/build", a.PostBuild)
	r.Post("/build/preview", a.PostBuildPreview)

	r.Get("/login", a.GetLogin)
	r.Post("/logout", a.PostLogout)
	r.Get("/callback/discord", a.GetCallbackDiscord)

	r.With(RequireAuth).Get("/my/monsters", a.GetMyMonsters)
	r.With(RequireAuth).Get("/my/monsters/{id}/edit", a.GetMyMonstersEdit)
	r.With(RequireAuth).Post("/my/monsters/{id}", a.UpdateMonster)
	r.With(RequireAuth).Delete("/my/monsters/{id}", a.DeleteMonster)

	r.Get("/*", http.FileServer(http.FS(assets.FS)).ServeHTTP)
	a.router = r
}

func (a *App) Home(w http.ResponseWriter, r *http.Request) {
	vd := web.ViewData{
		CurrentUser: a.CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Welcome",
	}
	layouts.Global(vd, pages.Home()).Render(r.Context(), w)
}

func (a *App) GetBuild(w http.ResponseWriter, r *http.Request) {
	vd := web.ViewData{
		CurrentUser: a.CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Builder",
	}
	m := nimble.Monster{
		Speed: 6,
		Size:  nimble.SizeMedium,
		Armor: nimble.ArmorUnarmored,
	}
	layouts.Global(vd, pages.Build(vd, m)).Render(r.Context(), w)

}

func sqlmonsterFromMonster(m nimble.Monster) sqldb.Monster {
	actions := make([][]byte, 0, len(m.Actions))
	for _, action := range m.Actions {
		b, _ := json.Marshal(action)
		actions = append(actions, json.RawMessage(b))
	}
	abilities := make([][]byte, 0, len(m.Abilities))
	for _, activity := range m.Abilities {
		b, _ := json.Marshal(activity)
		abilities = append(abilities, json.RawMessage(b))
	}
	return sqldb.Monster{
		Name:      m.Name,
		Level:     m.Level,
		Hp:        int32(m.HP),
		Armor:     sqldb.NullArmorType{Valid: true, ArmorType: sqldb.ArmorType(m.Armor)},
		Size:      sqldb.NullSizeType{Valid: true, SizeType: sqldb.SizeType(m.Size)},
		Speed:     pgtype.Int4{Valid: true, Int32: int32(m.Speed)},
		Fly:       pgtype.Int4{Valid: true, Int32: int32(m.Fly)},
		Swim:      pgtype.Int4{Valid: true, Int32: int32(m.Swim)},
		Actions:   actions,
		Abilities: abilities,
	}
}

func (a *App) PostBuild(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	monster, err := monsterFromForm(r)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	m := sqlmonsterFromMonster(monster)

	_, err = a.db.CreateMonster(r.Context(), sqldb.CreateMonsterParams{
		Name:      m.Name,
		Level:     m.Level,
		Hp:        m.Hp,
		Armor:     m.Armor,
		Size:      m.Size,
		Speed:     m.Speed,
		Fly:       m.Fly,
		Swim:      m.Swim,
		Actions:   m.Actions,
		Abilities: m.Abilities,
		UserID:    a.CurrentUser(ctx).ID,
	})
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	http.Redirect(w, r, "/my/monsters", 303)
}

func (a *App) PostBuildPreview(w http.ResponseWriter, r *http.Request) {
	monster, err := monsterFromForm(r)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	components.MonsterCard(monster).Render(r.Context(), w)
}

func monsterFromForm(r *http.Request) (nimble.Monster, error) {
	if err := r.ParseForm(); err != nil {
	}

	n := func(s string) int { n, _ := strconv.Atoi(r.FormValue(s)); return n }
	monster := nimble.Monster{
		Name:  r.FormValue("name"),
		Level: r.FormValue("level"),
		Size:  nimble.MonsterSize(r.FormValue("size")),
		Armor: nimble.MonsterArmor(r.FormValue("armor")),
		Swim:  n("swim"),
		Fly:   n("fly"),
		Speed: n("speed"),
		HP:    n("hp"),
	}

	abilities := r.PostForm["ability[][name]"]
	for i := range abilities {
		if abilities[i] != "" {
			monster.Abilities = append(monster.Abilities, nimble.Ability{
				Name:        r.PostForm["ability[][name]"][i],
				Description: r.PostForm["ability[][description]"][i],
			})
		}
	}

	actions := r.PostForm["action[][name]"]
	for i := range actions {
		if actions[i] != "" {
			monster.Actions = append(monster.Actions, nimble.Action{
				Name:        r.PostForm["action[][name]"][i],
				Damage:      r.PostForm["action[][damage]"][i],
				Description: r.PostForm["action[][description]"][i],
			})
		}
	}
	return monster, nil
}

func (a *App) GetMyMonsters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	currentUser := a.CurrentUser(ctx)
	dbmonsters, err := a.db.ListMonstersByUserID(ctx, currentUser.ID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	vd := web.ViewData{
		CurrentUser: a.CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "My Monsters",
	}

	monsters := xiter.Map(slices.Values(dbmonsters), monsterToDisplay)
	layouts.Global(vd, pages.MyMonsters(slices.Collect(monsters))).Render(r.Context(), w)

}

func (a *App) GetMyMonstersEdit(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	monster, err := a.db.GetMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "sorry, something went wrong", 500)
		return
	}
	if monster.UserID != a.CurrentUser(ctx).ID {
		http.Error(w, "not authorized", 403)
		return
	}

	vd := web.ViewData{
		CurrentUser: a.CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Edit",
	}
	layouts.Global(vd, pages.Build(vd, monsterToDisplay(monster))).Render(r.Context(), w)
}

func (a *App) UpdateMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	current, err := a.db.GetMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "sorry, something went wrong", 500)
		return
	}
	if current.UserID != a.CurrentUser(ctx).ID {
		http.Error(w, "not authorized", 403)
		return
	}

	update, err := monsterFromForm(r)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	m := sqlmonsterFromMonster(update)

	_, err = a.db.UpdateMonster(r.Context(), sqldb.UpdateMonsterParams{
		ID:        pgtype.UUID{Bytes: id, Valid: true},
		Name:      m.Name,
		Level:     m.Level,
		Hp:        m.Hp,
		Armor:     m.Armor,
		Size:      m.Size,
		Speed:     m.Speed,
		Fly:       m.Fly,
		Swim:      m.Swim,
		Actions:   m.Actions,
		Abilities: m.Abilities,
		UserID:    a.CurrentUser(ctx).ID,
	})
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	http.Redirect(w, r, "/my/monsters", 303)
}

func (a *App) DeleteMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	current, err := a.db.GetMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, err.Error(), 500)
		return
	}
	if current.UserID != a.CurrentUser(ctx).ID {
		http.Error(w, "not authorized", 403)
		return
	}

	_, err = a.db.DeleteMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if current.UserID != a.CurrentUser(ctx).ID {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "sorry, something went wrong", 500)
		return
	}
}

func monsterToDisplay(in sqldb.Monster) nimble.Monster {
	var err error
	var size nimble.MonsterSize
	switch in.Size.SizeType {
	case sqldb.SizeTypeTiny:
		size = nimble.SizeTiny
	case sqldb.SizeTypeSmall:
		size = nimble.SizeSmall
	case sqldb.SizeTypeMedium:
		size = nimble.SizeMedium
	case sqldb.SizeTypeLarge:
		size = nimble.SizeLarge
	case sqldb.SizeTypeHuge:
		size = nimble.SizeHuge
	case sqldb.SizeTypeGargantuan:
		size = nimble.SizeGargantuan
	default:
		panic("unknown monster size" + in.Size.SizeType)
	}

	var armor nimble.MonsterArmor
	switch in.Armor.ArmorType {
	case sqldb.ArmorTypeNone:
		armor = nimble.ArmorUnarmored
	case sqldb.ArmorTypeMedium:
		armor = nimble.ArmorMedium
	case sqldb.ArmorTypeHeavy:
		armor = nimble.ArmorHeavy
	default:
		panic("unknown monster armor" + in.Armor.ArmorType)
	}

	out := nimble.Monster{
		ID:    uuid.UUID(in.ID.Bytes).String(),
		Name:  in.Name,
		Level: in.Level,
		Size:  size,
		Armor: armor,
		Swim:  int(in.Swim.Int32),
		Fly:   int(in.Fly.Int32),
		Speed: int(in.Speed.Int32),
		HP:    int(in.Hp),
	}
	out.Actions = make([]nimble.Action, len(in.Actions))
	for i, a := range in.Actions {
		err = errors.Join(err, json.Unmarshal(a, &out.Actions[i]))
	}
	out.Abilities = make([]nimble.Ability, len(in.Abilities))
	for i, a := range in.Abilities {
		err = errors.Join(err, json.Unmarshal(a, &out.Abilities[i]))
	}
	return out
}

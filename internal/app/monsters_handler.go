package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"slices"
	"strconv"

	"deedles.dev/xiter"
	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/web"
	"nimble.monster/web/components"
	"nimble.monster/web/layouts"
	"nimble.monster/web/pages"
)

type MonstersHandler struct {
	db *sqldb.Queries
}

func NewMonstersHandler(db *sqldb.Queries) *MonstersHandler {
	return &MonstersHandler{db: db}
}

func (h *MonstersHandler) GetBuild(w http.ResponseWriter, r *http.Request) {
	vd := web.GlobalProps{
		CurrentUser: CurrentUser(r.Context()),
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

func (h *MonstersHandler) PostBuild(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	monster, err := monsterFromForm(r)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	m := sqlmonsterFromMonster(monster)

	_, err = h.db.CreateMonster(r.Context(), sqldb.CreateMonsterParams{
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
		UserID:    CurrentUser(ctx).ID,
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}
	http.Redirect(w, r, "/my/monsters", 303)
}

func (h *MonstersHandler) PostBuildPreview(w http.ResponseWriter, r *http.Request) {
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

func (h *MonstersHandler) GetMyMonsters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	currentUser := CurrentUser(ctx)
	dbmonsters, err := h.db.ListMonsters(ctx, currentUser.ID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		trace.SpanFromContext(r.Context()).RecordError(err)
		return
	}

	if ids := r.URL.Query()["ids"]; len(ids) > 0 {
		dbmonsters = slices.Collect(xiter.Filter(slices.Values(dbmonsters), func(m sqldb.Monster) bool {
			return slices.Contains(ids, uuid.UUID(m.ID.Bytes).String())
		}))
	}

	display := pages.MonsterDisplayCard
	if d := r.URL.Query().Get("display"); d != "" && pages.MonsterDisplay(d).Valid() {
		display = pages.MonsterDisplay(d)
	}

	props := pages.MyMonstersProps{
		GlobalProps: web.GlobalProps{
			CurrentUser: CurrentUser(r.Context()),
			CurrentURL:  r.URL,
			Title:       "My Monsters",
		},
		Monsters: slices.Collect(xiter.Map(slices.Values(dbmonsters), monsterToDisplay)),
		Display:  display,
	}

	c := pages.MyMonsters(props)
	if r.Header.Get("HX-Request") != "true" {
		c = layouts.Global(props.GlobalProps, c)
	}
	c.Render(r.Context(), w)
}

func (h *MonstersHandler) GetMyMonstersEdit(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	monster, err := h.db.GetMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "sorry, something went wrong", 500)
		return
	}
	if monster.UserID != CurrentUser(ctx).ID {
		http.Error(w, "not authorized", 403)
		return
	}

	vd := web.GlobalProps{
		CurrentUser: CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Edit › " + monster.Name,
	}
	layouts.Global(vd, pages.Build(vd, monsterToDisplay(monster))).Render(r.Context(), w)
}

func (h *MonstersHandler) UpdateMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	current, err := h.db.GetMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "sorry, something went wrong", 500)
		return
	}
	if current.UserID != CurrentUser(ctx).ID {
		http.Error(w, "not authorized", 403)
		return
	}

	update, err := monsterFromForm(r)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	m := sqlmonsterFromMonster(update)

	_, err = h.db.UpdateMonster(r.Context(), sqldb.UpdateMonsterParams{
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
		UserID:    CurrentUser(ctx).ID,
	})
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	http.Redirect(w, r, "/my/monsters", 303)
}

func (h *MonstersHandler) DeleteMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	current, err := h.db.GetMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, err.Error(), 500)
		return
	}
	if current.UserID != CurrentUser(ctx).ID {
		http.Error(w, "not authorized", 403)
		return
	}

	_, err = h.db.DeleteMonster(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if current.UserID != CurrentUser(ctx).ID {
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

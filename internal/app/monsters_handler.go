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
	"github.com/jackc/pgx/v5"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
)

type MonstersHandler struct {
	db *sqldb.Queries
}

func NewMonstersHandler(db *sqldb.Queries) *MonstersHandler {
	return &MonstersHandler{db: db}
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
	var armor sqldb.ArmorType
	switch m.Armor {
	case nimble.ArmorUnarmored:
		armor = sqldb.ArmorTypeNone
	case nimble.ArmorMedium:
		armor = sqldb.ArmorTypeMedium
	case nimble.ArmorHeavy:
		armor = sqldb.ArmorTypeHeavy
	default:
		panic("unknown monster armor" + m.Armor)
	}
	return sqldb.Monster{
		Name:      m.Name,
		Level:     m.Level,
		Hp:        int32(m.HP),
		Armor:     armor,
		Size:      sqldb.SizeType(m.Size),
		Speed:     int32(m.Speed),
		Fly:       int32(m.Fly),
		Swim:      int32(m.Swim),
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
	http.Redirect(w, r, "/monsters", 303)
}

func (h *MonstersHandler) CreateMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var monster nimble.Monster
	err := json.NewDecoder(r.Body).Decode(&monster)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	m := sqlmonsterFromMonster(monster)

	created, err := h.db.CreateMonster(r.Context(), sqldb.CreateMonsterParams{
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

	if err := json.NewEncoder(w).Encode(nimble.MonsterFromSQL(created)); err != nil {
		Error(ctx, w, err)
		return
	}

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

func (h *MonstersHandler) ListMyMonsters(w http.ResponseWriter, r *http.Request) {
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
			return slices.Contains(ids, m.ID.String())
		}))
	}

	if err := json.NewEncoder(w).Encode(struct {
		Monsters []nimble.Monster `json:"monsters"`
	}{
		Monsters: slices.Collect(xiter.Map(slices.Values(dbmonsters), nimble.MonsterFromSQL)),
	}); err != nil {
		http.Error(w, err.Error(), 500)
		trace.SpanFromContext(r.Context()).RecordError(err)
	}
}

func (h *MonstersHandler) GetMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		w.WriteHeader(404)
		return
	}
	monster, err := h.db.GetMonster(ctx, CurrentUser(ctx).ID, id)
	if errors.Is(err, pgx.ErrNoRows) {
		w.WriteHeader(404)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(nimble.MonsterFromSQL(monster)); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *MonstersHandler) UpdateMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	span.SetAttributes(attribute.String("params.id", id.String()))
	if err != nil {
		w.WriteHeader(404)
		return
	}
	_, err = h.db.GetMonster(ctx, CurrentUser(ctx).ID, id)
	if errors.Is(err, pgx.ErrNoRows) {
		w.WriteHeader(404)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	var monster nimble.Monster
	if err := json.NewDecoder(r.Body).Decode(&monster); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	m := sqlmonsterFromMonster(monster)

	_, err = h.db.UpdateMonster(r.Context(), sqldb.UpdateMonsterParams{
		UserID:    CurrentUser(ctx).ID,
		UserID_2:  CurrentUser(ctx).ID, // editor
		ID:        id,
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
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(nimble.MonsterFromSQL(m)); err != nil {
		Error(ctx, w, err)
		return
	}
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
	current, err := h.db.GetMonster(ctx, CurrentUser(ctx).ID, id)
	if errors.Is(err, pgx.ErrNoRows) {
		w.WriteHeader(404)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	_, err = h.db.DeleteMonster(ctx, CurrentUser(ctx).ID, id)
	if current.UserID != CurrentUser(ctx).ID {
		Error(ctx, w, err)
		return
	}

	w.WriteHeader(204)
}

package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"slices"
	"strings"

	"deedles.dev/xiter"
	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/xslices"
)

type MonstersHandler struct {
	db sqldb.MonsterQuerier
}

func NewMonstersHandler(db sqldb.MonsterQuerier) *MonstersHandler {
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
	case nimble.ArmorNone:
		armor = sqldb.ArmorTypeValue0
	case nimble.ArmorMedium:
		armor = sqldb.ArmorTypeMedium
	case nimble.ArmorHeavy:
		armor = sqldb.ArmorTypeHeavy
	default:
		panic("unknown monster armor " + m.Armor)
	}
	return sqldb.Monster{
		Name:       m.Name,
		Level:      m.Level,
		Hp:         m.HP,
		Armor:      armor,
		Size:       sqldb.SizeType(m.Size),
		Speed:      m.Speed,
		Fly:        m.Fly,
		Swim:       m.Swim,
		Actions:    actions,
		Abilities:  abilities,
		Legendary:  m.Legendary,
		Kind:       m.Kind,
		Bloodied:   m.Bloodied,
		LastStand:  m.LastStand,
		Saves:      xslices.Map(strings.Split(m.Saves, ","), strings.TrimSpace),
		Visibility: sqldb.MonsterVisibility(m.Visibility),
	}
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

	var created sqldb.Monster
	if monster.Legendary {
		created, err = h.db.CreateLegendaryMonster(ctx, sqldb.CreateLegendaryMonsterParams{
			Actions:   m.Actions,
			Abilities: m.Abilities,
			UserID:    CurrentUser(ctx).ID,
			Name:      m.Name,
			Level:     m.Level,
			Hp:        m.Hp,
			Armor:     m.Armor,
			Kind:      m.Kind,
			Size:      m.Size,
			Bloodied:  m.Bloodied,
			LastStand: m.LastStand,
			Saves:     m.Saves,
		})
	} else {
		created, err = h.db.CreateMonster(r.Context(), sqldb.CreateMonsterParams{
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
	}
	if err != nil {
		Error(ctx, w, err)
		return
	}

	nmonster, err := nimble.MonsterFromSQL(created)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(nmonster); err != nil {
		Error(ctx, w, err)
		return
	}

}

func (h *MonstersHandler) ListPublicMonsters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	dbmonsters, err := h.db.ListPublicMonsters(ctx)
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

	nmonsters, errs := xslices.Map2(dbmonsters, nimble.MonsterFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}
	if err := json.NewEncoder(w).Encode(struct {
		Monsters []nimble.Monster `json:"monsters"`
	}{
		Monsters: nmonsters,
	}); err != nil {
		http.Error(w, err.Error(), 500)
		trace.SpanFromContext(r.Context()).RecordError(err)
	}
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

	nmonsters, errs := xslices.Map2(dbmonsters, nimble.MonsterFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}
	if err := json.NewEncoder(w).Encode(struct {
		Monsters []nimble.Monster `json:"monsters"`
	}{
		Monsters: nmonsters,
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

	nmonster, err := nimble.MonsterFromSQL(monster)
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nmonster); err != nil {
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

	if monster.Legendary {
		_, err = h.db.UpdateLegendaryMonster(ctx, sqldb.UpdateLegendaryMonsterParams{
			Actions:    m.Actions,
			Abilities:  m.Abilities,
			UserID:     CurrentUser(ctx).ID,
			ID:         id,
			Name:       m.Name,
			Level:      m.Level,
			Hp:         m.Hp,
			Armor:      m.Armor,
			Kind:       m.Kind,
			Size:       m.Size,
			Bloodied:   m.Bloodied,
			LastStand:  m.LastStand,
			Saves:      m.Saves,
			Visibility: m.Visibility,
		})
	} else {
		_, err = h.db.UpdateMonster(r.Context(), sqldb.UpdateMonsterParams{
			UserID:     CurrentUser(ctx).ID,
			ID:         id,
			Name:       m.Name,
			Level:      m.Level,
			Hp:         m.Hp,
			Armor:      m.Armor,
			Size:       m.Size,
			Speed:      m.Speed,
			Fly:        m.Fly,
			Swim:       m.Swim,
			Actions:    m.Actions,
			Abilities:  m.Abilities,
			Visibility: m.Visibility,
		})
	}
	if err != nil {
		Error(ctx, w, err)
		return
	}

	nmonster, err := nimble.MonsterFromSQL(m)
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nmonster); err != nil {
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

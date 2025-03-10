package app

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/nimble"
)

type MonstersHandler struct {
	Monsters nimble.MonsterStore
}

func NewMonstersHandler(m nimble.MonsterStore) *MonstersHandler {
	return &MonstersHandler{Monsters: m}
}

func (h *MonstersHandler) CreateMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var monster nimble.Monster
	err := json.NewDecoder(r.Body).Decode(&monster)
	if err != nil {
		w.WriteHeader(400)
		return
	}

	// FIXME: this hack
	monster.Creator = *nimble.CurrentUser(ctx)
	nmonster, err := h.Monsters.Create(ctx, monster)
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nmonster); err != nil {
		Error(ctx, w, err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *MonstersHandler) ListPublicMonsters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	monsters, err := h.Monsters.ListPublic(ctx)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Monsters []nimble.Monster `json:"monsters"`
	}{
		Monsters: monsters,
	}); err != nil {
		Error(ctx, w, err)
	}
}

func (h *MonstersHandler) ListMyMonsters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	monsters, err := h.Monsters.ListForUser(ctx, nimble.CurrentUser(ctx).ID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		trace.SpanFromContext(r.Context()).RecordError(err)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Monsters []nimble.Monster `json:"monsters"`
	}{
		Monsters: monsters,
	}); err != nil {
		Error(ctx, w, err)
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

	monster, err := h.Monsters.Get(ctx, nimble.MonsterID(id))
	if errors.Is(err, nimble.ErrNotFound) {
		w.WriteHeader(404)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	if monster.Visibility == nimble.MonsterVisibilityPrivate &&
		monster.Creator.ID != nimble.CurrentUser(ctx).ID {
		w.WriteHeader(403)
		return
	}

	if err := json.NewEncoder(w).Encode(monster); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *MonstersHandler) UpdateMonster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	urlid := chi.URLParam(r, "id")
	span.SetAttributes(attribute.String("params.id", urlid))
	id, err := uuid.FromString(urlid)
	if err != nil {
		w.WriteHeader(400)
		return
	}

	var monster nimble.Monster
	if err := json.NewDecoder(r.Body).Decode(&monster); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(nimble.Error{Message: err.Error()})
		return
	}

	current, err := h.Monsters.Get(ctx, nimble.MonsterID(id))
	if err != nil {
		Error(ctx, w, err)
		return
	}

	cuser := nimble.CurrentUser(ctx)
	if current.Creator.ID != cuser.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	monster.ID = nimble.MonsterID(id)
	monster, err = h.Monsters.Update(ctx, monster)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(monster); err != nil {
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

	current, err := h.Monsters.Get(ctx, nimble.MonsterID(id))
	if err != nil {
		Error(ctx, w, err)
		return
	}

	cuser := nimble.CurrentUser(ctx)
	if current.Creator.ID != cuser.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	err = h.Monsters.Delete(ctx, nimble.MonsterID(id))
	if errors.Is(err, nimble.ErrNotFound) {
		http.Error(w, err.Error(), 404)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	w.WriteHeader(204)
}

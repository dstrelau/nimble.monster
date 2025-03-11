package app

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"nimble.monster/internal/nimble"
)

type FamiliesHandler struct {
	Families nimble.FamilyStore
	Monsters nimble.MonsterStore
}

func NewFamiliesHandler(families nimble.FamilyStore, monsters nimble.MonsterStore) *FamiliesHandler {
	return &FamiliesHandler{Families: families, Monsters: monsters}
}

func (h *FamiliesHandler) ListPublicFamilies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	fams, err := h.Families.ListPublic(ctx)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Families []nimble.Family `json:"families"`
	}{
		Families: fams,
	}); err != nil {
		Error(ctx, w, err)
	}
}

func (h *FamiliesHandler) ListMyFamilies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := nimble.CurrentUser(ctx)
	fams, err := h.Families.ListForUser(ctx, user.ID)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Families []nimble.Family `json:"families"`
	}{
		Families: fams,
	}); err != nil {
		Error(ctx, w, err)
	}
}

func (h *FamiliesHandler) GetFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	idStr := chi.URLParam(r, "id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	family, err := h.Families.Get(ctx, nimble.FamilyID(id))
	if err != nil {
		Error(ctx, w, err)
		return
	}

	user := nimble.CurrentUser(ctx)
	if family.CreatorID != user.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	if err := json.NewEncoder(w).Encode(family); err != nil {
		Error(ctx, w, err)
	}
}

type createFamilyRequest struct {
	Name      string           `json:"name"`
	Abilities []nimble.Ability `json:"abilities"`
}

func (h *FamiliesHandler) CreateFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := nimble.CurrentUser(ctx)

	var req createFamilyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(ctx, w, nimble.Error{Message: "Invalid request body"})
		return
	}

	// Always set visibility to private
	visibility := nimble.FamilyVisibilityPrivate

	family := nimble.Family{
		Name:       req.Name,
		Abilities:  req.Abilities,
		Visibility: visibility,
		CreatorID:  user.ID,
	}

	created, err := h.Families.Create(ctx, family)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(created); err != nil {
		Error(ctx, w, err)
	}
}

func (h *FamiliesHandler) UpdateFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := nimble.CurrentUser(ctx)

	idStr := chi.URLParam(r, "id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	// Get the family to check if it exists and to preserve fields not being updated
	family, err := h.Families.Get(ctx, nimble.FamilyID(id))
	if err != nil {
		Error(ctx, w, err)
		return
	}

	// Check if the user owns this family
	if family.CreatorID != user.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	var req createFamilyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(ctx, w, err)
		return
	}

	updatedFamily := nimble.Family{
		ID:         nimble.FamilyID(id),
		CreatorID:  user.ID, // Preserve the creator
		Name:       req.Name,
		Abilities:  req.Abilities,
		Visibility: family.Visibility,
	}

	updated, err := h.Families.Update(ctx, updatedFamily)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(updated); err != nil {
		Error(ctx, w, err)
	}
}

func (h *FamiliesHandler) DeleteFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := nimble.CurrentUser(ctx)

	idStr := chi.URLParam(r, "id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	family, err := h.Families.Get(ctx, nimble.FamilyID(id))
	if err != nil {
		Error(ctx, w, err)
		return
	}

	// Check if the user owns this family
	if family.CreatorID != user.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	if family.MonsterCount > 0 {
		w.WriteHeader(http.StatusPreconditionFailed)
		return
	}

	if err := h.Families.Delete(ctx, nimble.FamilyID(id)); err != nil {
		Error(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

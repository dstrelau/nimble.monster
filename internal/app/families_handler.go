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

type createFamilyRequest struct {
	Name      string           `json:"name"`
	Abilities []nimble.Ability `json:"abilities"`
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

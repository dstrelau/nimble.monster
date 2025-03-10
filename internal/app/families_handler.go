package app

import (
	"encoding/json"
	"net/http"

	"nimble.monster/internal/nimble"
)

type FamiliesHandler struct {
	Families nimble.FamilyStore
}

func NewFamiliesHandler(families nimble.FamilyStore) *FamiliesHandler {
	return &FamiliesHandler{Families: families}
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
	if err := json.NewEncoder(w).Encode(struct {
		Families []nimble.Family `json:"families"`
	}{
		Families: []nimble.Family{},
	}); err != nil {
		Error(ctx, w, err)
	}
}

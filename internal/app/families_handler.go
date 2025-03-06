package app

import (
	"encoding/json"
	"errors"
	"net/http"

	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/xslices"
)

type FamiliesHandler struct {
	db sqldb.FamilyQuerier
}

func NewFamiliesHandler(db sqldb.FamilyQuerier) *FamiliesHandler {
	return &FamiliesHandler{db: db}
}

func (h *FamiliesHandler) ListPublicFamilies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	fams, err := h.db.ListPublicFamilies(ctx)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	nfams, errs := xslices.Map2(fams, nimble.FamilyFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Families []nimble.Family `json:"families"`
	}{
		Families: nfams,
	}); err != nil {
		Error(ctx, w, err)
	}
}

func (h *FamiliesHandler) ListMyFamilies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	currentUser := CurrentUser(ctx)
	if currentUser == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	fams, err := h.db.ListFamilies(ctx, currentUser.ID)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	nfams, errs := xslices.Map2(fams, nimble.FamilyFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Families []nimble.Family `json:"families"`
	}{
		Families: nfams,
	}); err != nil {
		Error(ctx, w, err)
	}
}

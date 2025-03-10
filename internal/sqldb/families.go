package sqldb

import (
	"context"
	"encoding/json"
	"errors"

	"nimble.monster/internal/nimble"
	"nimble.monster/internal/xslices"
)

var _ nimble.FamilyStore = (*FamilyStore)(nil)

type FamilyStore struct {
	db Querier
}

func NewFamilyStore(db Querier) *FamilyStore {
	return &FamilyStore{db: db}
}

func (s *FamilyStore) ListPublic(ctx context.Context) ([]nimble.Family, error) {
	families, err := s.db.ListPublicFamilies(ctx)
	if err != nil {
		return nil, err
	}
	fs, errs := xslices.Map2(families, familyFromSQL)
	return fs, errors.Join(errs...)
}

func familyFromSQL(in Family) (nimble.Family, error) {
	out := nimble.Family{
		ID:         nimble.FamilyID(in.ID),
		Name:       in.Name,
		Visibility: nimble.FamilyVisibility(in.Visibility),
	}
	var err error
	out.Abilities = make([]nimble.Ability, len(in.Abilities))
	for i, a := range in.Abilities {
		err = errors.Join(err, json.Unmarshal(a, &out.Abilities[i]))
	}
	return out, err
}

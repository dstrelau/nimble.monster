package sqldb

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/gofrs/uuid"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/xslices"
)

var _ nimble.FamilyStore = (*FamilyStore)(nil)

type FamilyStore struct {
	db Querier
}

type FamilyWithMonsterCount GetFamilyRow

func NewFamilyStore(db Querier) *FamilyStore {
	return &FamilyStore{db: db}
}

func (s *FamilyStore) ListPublic(ctx context.Context) ([]nimble.Family, error) {
	families, err := s.db.ListPublicFamilies(ctx)
	if err != nil {
		return nil, err
	}
	fs, errs := xslices.Map2(families, func(f ListPublicFamiliesRow) (nimble.Family, error) {
		return familyFromSQL(FamilyWithMonsterCount(f))
	})
	return fs, errors.Join(errs...)
}

func (s *FamilyStore) ListForUser(ctx context.Context, userID nimble.UserID) ([]nimble.Family, error) {
	families, err := s.db.ListFamiliesForUser(ctx, uuid.UUID(userID))
	if err != nil {
		return nil, err
	}
	fs, errs := xslices.Map2(families, func(f ListFamiliesForUserRow) (nimble.Family, error) {
		return familyFromSQL(FamilyWithMonsterCount(f))
	})
	return fs, errors.Join(errs...)
}

func (s *FamilyStore) Get(ctx context.Context, id nimble.FamilyID) (nimble.Family, error) {
	family, err := s.db.GetFamily(ctx, uuid.UUID(id))
	if err != nil {
		return nimble.Family{}, err
	}
	return familyFromSQL(FamilyWithMonsterCount(family))
}

func (s *FamilyStore) Create(ctx context.Context, family nimble.Family) (nimble.Family, error) {
	abilities := make([][]byte, len(family.Abilities))
	for i, ability := range family.Abilities {
		data, err := json.Marshal(ability)
		if err != nil {
			return nimble.Family{}, err
		}
		abilities[i] = data
	}

	created, err := s.db.CreateFamily(ctx, CreateFamilyParams{
		UserID:     uuid.UUID(family.CreatorID),
		Name:       family.Name,
		Abilities:  abilities,
		Visibility: FamilyVisibility(family.Visibility),
	})
	if err != nil {
		return nimble.Family{}, err
	}

	// no monsters yet
	return familyFromSQL(FamilyWithMonsterCount{Family: created})
}

func (s *FamilyStore) Update(ctx context.Context, family nimble.Family) (nimble.Family, error) {
	abilities := make([][]byte, len(family.Abilities))
	for i, ability := range family.Abilities {
		data, err := json.Marshal(ability)
		if err != nil {
			return nimble.Family{}, err
		}
		abilities[i] = data
	}

	updated, err := s.db.UpdateFamily(ctx, UpdateFamilyParams{
		ID:         uuid.UUID(family.ID),
		Name:       family.Name,
		Abilities:  abilities,
		Visibility: FamilyVisibility(family.Visibility),
	})
	if err != nil {
		return nimble.Family{}, err
	}

	return s.Get(ctx, nimble.FamilyID(updated.ID))
}

func (s *FamilyStore) Delete(ctx context.Context, id nimble.FamilyID) error {
	return s.db.DeleteFamily(ctx, uuid.UUID(id))
}

func familyFromSQL(in FamilyWithMonsterCount) (nimble.Family, error) {
	out := nimble.Family{
		ID:           nimble.FamilyID(in.Family.ID),
		CreatorID:    nimble.UserID(in.Family.UserID),
		Name:         in.Family.Name,
		Visibility:   nimble.FamilyVisibility(in.Family.Visibility),
		MonsterCount: in.MonsterCount,
	}
	var err error
	out.Abilities = make([]nimble.Ability, len(in.Family.Abilities))
	for i, a := range in.Family.Abilities {
		err = errors.Join(err, json.Unmarshal(a, &out.Abilities[i]))
	}
	return out, err
}

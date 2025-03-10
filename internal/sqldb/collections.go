package sqldb

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/sourcegraph/conc/pool"

	"nimble.monster/internal/nimble"
	"nimble.monster/internal/xslices"
)

var _ nimble.CollectionStore = (*CollectionStore)(nil)

type CollectionWithCounts struct {
	Collection     Collection
	LegendaryCount int64
	StandardCount  int64
}

type CollectionStore struct {
	db       Querier
	monsters *MonsterStore
}

func NewCollectionStore(db Querier, monsters *MonsterStore) *CollectionStore {
	return &CollectionStore{
		db:       db,
		monsters: monsters,
	}
}

func (s *CollectionStore) Get(ctx context.Context, id nimble.CollectionID) (nimble.Collection, error) {
	p := pool.New().WithContext(ctx)
	var (
		col      GetCollectionRow
		monsters []Monster
	)
	p.Go(func(ctx context.Context) (err error) {
		col, err = s.db.GetCollection(ctx, uuid.UUID(id))
		return err
	})
	p.Go(func(ctx context.Context) (err error) {
		monsters, err = s.db.ListMonstersInCollection(ctx, uuid.UUID(id))
		return err
	})
	err := p.Wait()
	if err != nil {
		return nimble.Collection{}, err
	}

	user, err := s.db.GetUser(ctx, col.Collection.UserID)
	if err != nil {
		return nimble.Collection{}, err
	}

	monstersFamilies, err := s.monsters.monstersWithFamilies(ctx, monsters)
	if err != nil {
		return nimble.Collection{}, err
	}

	c := nimble.Collection{
		CollectionOverview: collectionOverviewFromSQL(CollectionWithCounts(col), user),
		Monsters:           monstersFamilies,
	}
	return c, nil
}

func (s *CollectionStore) ListForUser(ctx context.Context, userID nimble.UserID) ([]nimble.CollectionOverview, error) {
	collections, err := s.db.ListCollections(ctx, uuid.UUID(userID))
	if err != nil {
		return nil, err
	}
	user, err := s.db.GetUser(ctx, uuid.UUID(userID))
	if err != nil {
		return nil, err
	}

	return xslices.Map(collections, func(r ListCollectionsRow) nimble.CollectionOverview {
		return collectionOverviewFromSQL(CollectionWithCounts(r), user)
	}), nil
}

func (s *CollectionStore) ListPublic(ctx context.Context) ([]nimble.CollectionOverview, error) {
	collections, err := s.db.ListPublicCollections(ctx)
	if err != nil {
		return nil, err
	}

	userIDs := xslices.MapUniq(collections, func(r ListPublicCollectionsRow) uuid.UUID {
		return r.Collection.UserID
	})

	users, err := s.db.FindUsers(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	usersByID := xslices.KeyBy(users, func(u User) uuid.UUID { return u.ID })

	return xslices.Map(collections, func(r ListPublicCollectionsRow) nimble.CollectionOverview {
		u := usersByID[r.Collection.UserID]
		return collectionOverviewFromSQL(CollectionWithCounts(r), u)
	}), nil
}

func (s *CollectionStore) Create(ctx context.Context, c nimble.CollectionOverview) (nimble.Collection, error) {
	col, err := s.db.CreateCollection(ctx, CreateCollectionParams{
		UserID:      uuid.UUID(c.Creator.ID),
		Name:        c.Name,
		Description: c.Description,
		Visibility:  CollectionVisibility(c.Visibility),
	})
	if err != nil {
		return nimble.Collection{}, err
	}
	return s.Get(ctx, nimble.CollectionID(col.ID))
}

func (s *CollectionStore) Update(ctx context.Context, in nimble.CollectionOverview) (nimble.Collection, error) {
	_, err := s.db.UpdateCollection(ctx, UpdateCollectionParams{
		UserID:      uuid.UUID(in.Creator.ID),
		ID:          uuid.UUID(in.ID),
		Name:        in.Name,
		Visibility:  CollectionVisibility(in.Visibility),
		Description: in.Description,
	})
	if err != nil {
		return nimble.Collection{}, err
	}

	return s.Get(ctx, nimble.CollectionID(in.ID))
}

func (s *CollectionStore) SetMonsters(ctx context.Context, id nimble.CollectionID, mids []nimble.MonsterID) (nimble.Collection, error) {
	uid := uuid.UUID(id)
	currentMonsters, err := s.db.ListMonstersInCollection(ctx, uid)
	if err != nil {
		return nimble.Collection{}, err
	}

	desiredIDs := xslices.Map(mids, func(mid nimble.MonsterID) uuid.UUID { return uuid.UUID(mid) })
	currentIDs := xslices.Map(currentMonsters, func(m Monster) uuid.UUID { return m.ID })
	toAdd := xslices.Difference(desiredIDs, currentIDs)
	toRemove := xslices.Difference(currentIDs, desiredIDs)

	for _, id := range toAdd {
		if err := s.db.AddMonsterToCollection(ctx, id, uid); err != nil {
			return nimble.Collection{}, err
		}
	}

	for _, id := range toRemove {
		if err := s.db.RemoveMonsterFromCollection(ctx, id, uid); err != nil {
			return nimble.Collection{}, err
		}
	}

	return s.Get(ctx, id)
}

func (s *CollectionStore) Delete(ctx context.Context, id nimble.CollectionID) error {
	if _, err := s.db.DeleteCollection(ctx, uuid.UUID(id)); err != nil {
		return err
	}
	return nil
}

func collectionOverviewFromSQL(c CollectionWithCounts, u User) nimble.CollectionOverview {
	return nimble.CollectionOverview{
		Creator:        userFromSQL(u),
		ID:             nimble.CollectionID(c.Collection.ID),
		Name:           c.Collection.Name,
		Description:    c.Collection.Description,
		LegendaryCount: int(c.LegendaryCount),
		StandardCount:  int(c.StandardCount),
		Visibility:     nimble.CollectionVisibility(c.Collection.Visibility),
		CreatedAt:      c.Collection.CreatedAt.Time,
	}
}

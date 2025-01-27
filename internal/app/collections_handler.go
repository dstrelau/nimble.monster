package app

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"slices"

	"deedles.dev/xiter"
	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/sourcegraph/conc/pool"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/xslices"
)

type CollectionsHandler struct {
	db *sqldb.Queries
}

func NewCollectionsHandler(db *sqldb.Queries) *CollectionsHandler {
	return &CollectionsHandler{db: db}
}

func (h *CollectionsHandler) ListMyCollections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	currentUser := CurrentUser(r.Context())
	collections, err := h.db.ListCollections(ctx, currentUser.ID)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	ncollections := []nimble.Collection{}
	for _, c := range collections {
		ncollections = append(ncollections, nimble.Collection{
			ID:            c.ID.String(),
			Name:          c.Name,
			Visibility:    nimble.CollectionVisibility(c.Visibility),
			MonstersCount: int(c.MonsterCount),
			Creator:       c.UserID.String(),
		})
	}
	if err := json.NewEncoder(w).Encode(struct {
		Collections []nimble.Collection `json:"collections"`
	}{
		Collections: ncollections,
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var col nimble.Collection
	if err := json.NewDecoder(r.Body).Decode(&col); err != nil {
		Error(ctx, w, err)
		return
	}
	dbcol, err := h.db.CreateCollection(ctx, sqldb.CreateCollectionParams{
		Name:       col.Name,
		Visibility: sqldb.CollectionVisibility(col.Visibility),
		UserID:     CurrentUser(ctx).ID,
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nimble.Collection{
		ID:         dbcol.ID.String(),
		Name:       dbcol.Name,
		Visibility: nimble.CollectionVisibility(dbcol.Visibility),
		Creator:    dbcol.UserID.String(),
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) UpdateCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var col nimble.Collection
	if err := json.NewDecoder(r.Body).Decode(&col); err != nil {
		Error(ctx, w, err)
		return
	}
	id, err := uuid.FromString(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	_, err = h.db.UpdateCollection(ctx, sqldb.UpdateCollectionParams{
		UserID:     CurrentUser(ctx).ID,
		ID:         id,
		Name:       col.Name,
		Visibility: sqldb.CollectionVisibility(col.Visibility),
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nimble.Collection{
		ID:         id.String(),
		Name:       col.Name,
		Visibility: col.Visibility,
		Creator:    CurrentUser(ctx).ID.String(),
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) GetCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	id, err := uuid.FromString(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	span.SetAttributes(attribute.String("params.id", id.String()))
	currentUser := CurrentUser(ctx)

	p := pool.New().WithContext(ctx)
	var col sqldb.Collection
	var monsters []sqldb.Monster
	p.Go(func(ctx context.Context) (err error) {
		col, err = h.db.GetCollection(ctx, id)
		return err
	})
	p.Go(func(ctx context.Context) (err error) {
		monsters, err = h.db.ListMonstersInCollection(ctx, id)
		return err
	})
	err = p.Wait()
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "not found", 404)
		return
	} else if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		Error(ctx, w, err)
		return
	}
	if !col.Public.Bool {
		if currentUser == nil || currentUser.ID != col.UserID {
			http.Error(w, "not found", 404)
			return
		}
	}

	if err := json.NewEncoder(w).Encode(nimble.Collection{
		ID:         col.ID.String(),
		Name:       col.Name,
		Visibility: nimble.CollectionVisibility(col.Visibility),
		Creator:    col.UserID.String(),
		Monsters:   xslices.Map(monsters, nimble.MonsterFromSQL),
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) DeleteCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	id, err := uuid.FromString(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	span.SetAttributes(attribute.String("params.id", id.String()))

	_, err = h.db.DeleteCollection(ctx, CurrentUser(ctx).ID, id)
	if err != nil {
		Error(ctx, w, err)
		return
	}
	w.WriteHeader(204)
}

// func (h *CollectionsHandler) SearchMonsters(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
// 	query := r.FormValue("q")

// 	if query == "" {
// 		// Clear the results if the search box is empty
// 		w.Write([]byte("<div class='p-2 text-gray-500'>Type to search monsters...</div>"))
// 		return
// 	}

// 	monsters, err := h.db.SearchMonsters(ctx, query)
// 	if err != nil {
// 		Error(ctx, w, err)
// 		return
// 	}

// 	var nmonsters []nimble.Monster
// 	for _, m := range monsters {
// 		nmonsters = append(nmonsters, nimble.MonsterFromSQL(m))
// 	}
// 	pages.MonsterSearchResults(nmonsters).Render(ctx, w)
// }

// func (h *CollectionsHandler) GetMonsterPreview(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
// 	id := chi.URLParam(r, "id")
// 	uuid, err := uuid.FromString(id)
// 	if err != nil {
// 		http.Error(w, "not found", 404)
// 		return
// 	}
// 	monster, err := h.db.GetMonster(ctx, CurrentUser(ctx).ID, uuid)
// 	if err != nil {
// 		Error(ctx, w, err)
// 		return
// 	}

// 	components.MonsterCard(components.MonsterCardProps{Monster: nimble.MonsterFromSQL(monster)}).Render(ctx, w)
// }

// func (h *CollectionsHandler) AddMonsterToCollection(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
// 	span := trace.SpanFromContext(ctx)

// 	collectionID := chi.URLParam(r, "id")
// 	cuuid, err := uuid.FromString(collectionID)
// 	if err != nil {
// 		http.Error(w, "not found", 404)
// 		return
// 	}
// 	span.SetAttributes(attribute.String("params.collection_id", cuuid.String()))
// 	monsterID := r.FormValue("monster_id")
// 	span.SetAttributes(attribute.String("params.monster_id", monsterID))
// 	muuid, err := uuid.FromString(monsterID)
// 	if err != nil {
// 		span.RecordError(err)
// 		http.Error(w, "invalid monster_id", 400)
// 		return
// 	}

// 	err = h.db.AddMonsterToCollection(ctx, muuid, cuuid)
// 	if err != nil {
// 		Error(ctx, w, err)
// 		return
// 	}

// 	monsters, err := h.db.ListMonstersInCollection(ctx, cuuid)
// 	if err != nil {
// 		Error(ctx, w, err)
// 		return
// 	}
// 	nmonsters := slices.Collect(xiter.Map(slices.Values(monsters), nimble.MonsterFromSQL))
// 	components.MonsterCards(components.MonsterCardsProps{Monsters: nmonsters}).Render(ctx, w)
// }

func (h *CollectionsHandler) UpdateCollectionMonsters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	collectionID := chi.URLParam(r, "id")
	cuuid, err := uuid.FromString(collectionID)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	span.SetAttributes(attribute.String("params.collection_id", cuuid.String()))

	var desiredIDs []uuid.UUID
	if err := json.NewDecoder(r.Body).Decode(&desiredIDs); err != nil {
		Error(ctx, w, err)
		return
	}

	currentMonsters, err := h.db.ListMonstersInCollection(ctx, cuuid)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	currentIDs := xslices.Map(currentMonsters, func(m sqldb.Monster) uuid.UUID { return m.ID })
	toAdd := xslices.Difference(desiredIDs, currentIDs)
	toRemove := xslices.Difference(currentIDs, desiredIDs)

	for _, id := range toAdd {
		if err := h.db.AddMonsterToCollection(ctx, id, cuuid); err != nil {
			Error(ctx, w, err)
			return
		}
	}

	for _, id := range toRemove {
		if err := h.db.RemoveMonsterFromCollection(ctx, id, cuuid); err != nil {
			Error(ctx, w, err)
			return
		}
	}

	monsters, err := h.db.ListMonstersInCollection(ctx, cuuid)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	nmonsters := slices.Collect(xiter.Map(slices.Values(monsters), nimble.MonsterFromSQL))
	if err := json.NewEncoder(w).Encode(nmonsters); err != nil {
		Error(ctx, w, err)
		return
	}
}

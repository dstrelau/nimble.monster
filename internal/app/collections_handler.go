package app

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/sourcegraph/conc/pool"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"nimble.monster/internal/export"
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
			Description:   c.Description,
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

func (h *CollectionsHandler) ListPublicCollections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collections, err := h.db.ListPublicCollections(ctx)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	result := []nimble.PublicCollection{}
	for _, c := range collections {
		result = append(result, nimble.PublicCollection{
			ID:               c.ID.String(),
			Name:             c.Name,
			Visibility:       nimble.CollectionVisibility(c.Visibility),
			MonstersCount:    int(c.MonsterCount),
			LegendaryCount:   int(c.LegendaryCount),
			StandardCount:    int(c.StandardCount),
			Creator:          c.UserID.String(),
			CreatorName:      c.CreatorName,
			CreatorAvatar:    c.CreatorAvatar.String,
			CreatorDiscordID: c.CreatorDiscordID,
		})
	}

	if err := json.NewEncoder(w).Encode(struct {
		Collections []nimble.PublicCollection `json:"collections"`
	}{
		Collections: result,
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
		Name:        col.Name,
		Visibility:  sqldb.CollectionVisibility(col.Visibility),
		UserID:      CurrentUser(ctx).ID,
		Description: col.Description,
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nimble.Collection{
		ID:          dbcol.ID.String(),
		Name:        dbcol.Name,
		Visibility:  nimble.CollectionVisibility(dbcol.Visibility),
		Creator:     dbcol.UserID.String(),
		Description: dbcol.Description,
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
		UserID:      CurrentUser(ctx).ID,
		ID:          id,
		Name:        col.Name,
		Visibility:  sqldb.CollectionVisibility(col.Visibility),
		Description: col.Description,
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if err := json.NewEncoder(w).Encode(nimble.Collection{
		ID:          id.String(),
		Name:        col.Name,
		Visibility:  col.Visibility,
		Creator:     CurrentUser(ctx).ID.String(),
		Description: col.Description,
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) loadCollection(ctx context.Context, id uuid.UUID) (sqldb.Collection, []sqldb.Monster, error) {
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
	err := p.Wait()
	return col, monsters, err
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

	col, monsters, err := h.loadCollection(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "not found", 404)
		return
	} else if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		Error(ctx, w, err)
		return
	}
	// public or secret are both fine
	if col.Visibility == sqldb.CollectionVisibilityPrivate {
		if currentUser == nil || currentUser.ID != col.UserID {
			http.Error(w, "not found", 404)
			return
		}
	}

	nmonsters, errs := xslices.Map2(monsters, nimble.MonsterFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}

	if err := json.NewEncoder(w).Encode(nimble.Collection{
		ID:          col.ID.String(),
		Name:        col.Name,
		Visibility:  nimble.CollectionVisibility(col.Visibility),
		Creator:     col.UserID.String(),
		Monsters:    nmonsters,
		Description: col.Description,
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

	nmonsters, errs := xslices.Map2(monsters, nimble.MonsterFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}
	if err := json.NewEncoder(w).Encode(nmonsters); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) DownloadCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	currentUser := CurrentUser(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	span.SetAttributes(attribute.String("params.id", id.String()))

	col, monsters, err := h.loadCollection(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "not found", 404)
		return
	} else if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		Error(ctx, w, err)
		return
	}

	if col.Visibility == sqldb.CollectionVisibilityPrivate {
		if currentUser == nil || currentUser.ID != col.UserID {
			http.Error(w, "not found", 404)
			return
		}
	}

	nmonsters, errs := xslices.Map2(monsters, nimble.MonsterFromSQL)
	if e := errors.Join(errs...); e != nil {
		Error(ctx, w, e)
		return
	}

	pack := export.OBRCompendiumPack{
		Name:    col.Name,
		ID:      col.ID.String(),
		Version: strconv.FormatInt(col.CreatedAt.Time.Unix(), 10),
		Documents: xslices.Map(nmonsters, func(m nimble.Monster) export.OBRCompendiumNimbleMonster {
			// compendium expects null, "Medium", "Heavy"
			var armor *string
			switch m.Armor {
			case nimble.ArmorMedium:
				a := "Medium"
				armor = &a
			case nimble.ArmorHeavy:
				a := "Heavy"
				armor = &a
			}
			return export.OBRCompendiumNimbleMonster{
				Name:  m.Name,
				Type:  "nimblev2-monster",
				Level: m.Level,
				HP:    int(m.HP),
				Armor: armor,
				Features: xslices.Map(m.Abilities, func(a nimble.Ability) export.OBRCompendiumFeature {
					return export.OBRCompendiumFeature(a)
				}),
				Attacks: xslices.Map(m.Actions, func(a nimble.Action) export.OBRCompendiumFeature {

					return export.OBRCompendiumFeature{
						Name:        a.Name,
						Description: strings.Join([]string{a.Damage, a.Description}, " "),
					}
				}),
			}
		}),
	}

	if err := json.NewEncoder(w).Encode(pack); err != nil {
		Error(ctx, w, err)
		return
	}
}

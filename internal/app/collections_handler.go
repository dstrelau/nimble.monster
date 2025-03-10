package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/export"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/xslices"
)

type CollectionsHandler struct {
	Collections nimble.CollectionStore
}

func NewCollectionsHandler(c nimble.CollectionStore) *CollectionsHandler {
	return &CollectionsHandler{Collections: c}
}

func (h *CollectionsHandler) ListMyCollections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cuser := nimble.CurrentUser(ctx)

	// safe deref because handler has RequireAuth
	// currently: only list own collections
	collections, err := h.Collections.ListForUser(ctx, cuser.ID)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Collections []nimble.CollectionOverview `json:"collections"`
	}{
		Collections: collections,
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) ListPublicCollections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collections, err := h.Collections.ListPublic(ctx)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(struct {
		Collections []nimble.CollectionOverview `json:"collections"`
	}{
		Collections: collections,
	}); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var in nimble.Collection
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		Error(ctx, w, err)
		return
	}

	created, err := h.Collections.Create(ctx,
		nimble.CollectionOverview{
			Creator:     *nimble.CurrentUser(ctx),
			Name:        in.Name,
			Description: in.Description,
			Visibility:  nimble.CollectionVisibility(in.Visibility),
		},
	)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(created); err != nil {
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
	col.ID = nimble.CollectionID(id)

	current, err := h.Collections.Get(ctx, col.ID)
	if err != nil {
		Error(ctx, w, err)
		return
	}
	if current.Creator.ID != nimble.CurrentUser(ctx).ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	updated, err := h.Collections.Update(ctx, nimble.CollectionOverview{
		Creator:     *nimble.CurrentUser(ctx),
		ID:          col.ID,
		Name:        col.Name,
		Visibility:  col.Visibility,
		Description: col.Description,
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(updated); err != nil {
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

	col, err := h.Collections.Get(ctx, nimble.CollectionID(id))
	if errors.Is(err, nimble.ErrNotFound) {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	// public or secret are both fine
	cuser := nimble.CurrentUser(ctx)
	if col.Visibility == nimble.CollectionVisibilityPrivate &&
		(cuser == nil || cuser.ID != col.Creator.ID) {
		w.WriteHeader(http.StatusNotFound)
	}

	if err := json.NewEncoder(w).Encode(col); err != nil {
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

	if err := h.Collections.Delete(ctx, nimble.CollectionID(id)); err != nil {
		Error(ctx, w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
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

	col, err := h.Collections.Get(ctx, nimble.CollectionID(cuuid))
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if nimble.CurrentUser(ctx).ID != col.Creator.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	var desiredIDs []nimble.MonsterID
	if err := json.NewDecoder(r.Body).Decode(&desiredIDs); err != nil {
		Error(ctx, w, err)
		return
	}

	col, err = h.Collections.SetMonsters(ctx, nimble.CollectionID(cuuid), desiredIDs)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	if err := json.NewEncoder(w).Encode(col.Monsters); err != nil {
		Error(ctx, w, err)
		return
	}
}

func (h *CollectionsHandler) DownloadCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)

	id, err := uuid.FromString(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	span.SetAttributes(attribute.String("params.id", id.String()))

	col, err := h.Collections.Get(ctx, nimble.CollectionID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		Error(ctx, w, err)
		return
	}

	cuser := nimble.CurrentUser(ctx)
	if col.Visibility == nimble.CollectionVisibilityPrivate &&
		(cuser == nil || cuser.ID != col.Creator.ID) {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	pack := export.OBRCompendiumPack{
		Name:    col.Name,
		ID:      uuid.UUID(col.ID).String(),
		Version: strconv.FormatInt(col.CreatedAt.Unix(), 10),
		Documents: xslices.Map(col.Monsters, func(m nimble.Monster) export.OBRCompendiumNimbleMonster {
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

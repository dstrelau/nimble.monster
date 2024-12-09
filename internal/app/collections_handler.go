package app

import (
	"net/http"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"nimble.monster/internal/sqldb"
	"nimble.monster/internal/web"
	"nimble.monster/web/layouts"
	"nimble.monster/web/pages"
)

type CollectionsHandler struct {
	db *sqldb.Queries
}

func NewCollectionsHandler(db *sqldb.Queries) *CollectionsHandler {
	return &CollectionsHandler{db: db}
}

func (h *CollectionsHandler) GetCollections(w http.ResponseWriter, r *http.Request) {
	props := web.GlobalProps{
		CurrentUser: CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Collections",
	}
	layouts.Global(props, pages.Collections(props)).Render(r.Context(), w)
}

func (h *CollectionsHandler) GetCollectionsNew(w http.ResponseWriter, r *http.Request) {
	props := web.GlobalProps{
		CurrentUser: CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Collections",
	}
	layouts.Global(props, pages.CollectionsNew(props)).Render(r.Context(), w)
}

func (h *CollectionsHandler) PostCollections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	col, err := h.db.CreateCollection(ctx, sqldb.CreateCollectionParams{
		Name:   r.FormValue("name"),
		Public: pgtype.Bool{Valid: true, Bool: r.FormValue("public") == "true"},
		UserID: CurrentUser(ctx).ID,
	})
	if err != nil {
		Error(ctx, w, err)
		return
	}
	loc := "/my/collections/" + uuid.UUID(col.ID.Bytes).String()
	http.Redirect(w, r, loc, http.StatusSeeOther)
}

func (h *CollectionsHandler) GetCollectionsID(w http.ResponseWriter, r *http.Request) {
	props := web.GlobalProps{
		CurrentUser: CurrentUser(r.Context()),
		CurrentURL:  r.URL,
		Title:       "Collections",
	}
	layouts.Global(props, pages.Collections(props)).Render(r.Context(), w)
}

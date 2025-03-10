package nimble

import (
	"context"
	"time"
)

type CollectionStore interface {
	Get(context.Context, CollectionID) (Collection, error)
	ListPublic(context.Context) ([]CollectionOverview, error)
	ListForUser(context.Context, UserID) ([]CollectionOverview, error)
	Create(context.Context, CollectionOverview) (Collection, error)
	Update(context.Context, CollectionOverview) (Collection, error)
	SetMonsters(context.Context, CollectionID, []MonsterID) (Collection, error)
	Delete(context.Context, CollectionID) error
}

type CollectionVisibility string

const (
	CollectionVisibilityPublic  CollectionVisibility = "public"
	CollectionVisibilityPrivate CollectionVisibility = "private"
	CollectionVisibilitySecret  CollectionVisibility = "secret"
)

type CollectionOverview struct {
	Creator        User                 `json:"creator"`
	ID             CollectionID         `json:"id"`
	Name           string               `json:"name"`
	Description    string               `json:"description"`
	LegendaryCount int                  `json:"legendaryCount"`
	StandardCount  int                  `json:"standardCount"`
	Visibility     CollectionVisibility `json:"visibility"`
	CreatedAt      time.Time            `json:"createdAt"`
}

type Collection struct {
	CollectionOverview
	Monsters []Monster `json:"monsters"`
}

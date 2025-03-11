package nimble

import "context"

type FamilyStore interface {
	ListPublic(context.Context) ([]Family, error)
	ListForUser(context.Context, UserID) ([]Family, error)
	Get(context.Context, FamilyID) (Family, error)
	Create(context.Context, Family) (Family, error)
	Update(context.Context, Family) (Family, error)
	Delete(context.Context, FamilyID) error
}

type FamilyVisibility string

const (
	FamilyVisibilityPublic  FamilyVisibility = "public"
	FamilyVisibilityPrivate FamilyVisibility = "private"
	FamilyVisibilitySecret  FamilyVisibility = "secret"
)

type Family struct {
	ID           FamilyID         `json:"id"`
	CreatorID    UserID           `json:"creatorId,omitempty"`
	Abilities    []Ability        `json:"abilities"`
	Name         string           `json:"name"`
	Description  string           `json:"description"`
	Visibility   FamilyVisibility `json:"visibility"`
	MonsterCount int64            `json:"monsterCount,omitempty"`
}

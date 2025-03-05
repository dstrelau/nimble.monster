package sqldb

import (
	"context"

	"github.com/gofrs/uuid"
)

type MonsterQuerier interface {
	CreateMonster(ctx context.Context, arg CreateMonsterParams) (Monster, error)
	CreateLegendaryMonster(ctx context.Context, arg CreateLegendaryMonsterParams) (Monster, error)
	DeleteMonster(ctx context.Context, userID uuid.UUID, iD uuid.UUID) (Monster, error)
	GetMonster(ctx context.Context, userID uuid.UUID, iD uuid.UUID) (Monster, error)
	ListMonsters(ctx context.Context, userID uuid.UUID) ([]Monster, error)
	ListPublicMonsters(ctx context.Context) ([]Monster, error)
	SearchMonsters(ctx context.Context, lower string) ([]Monster, error)
	UpdateMonster(ctx context.Context, arg UpdateMonsterParams) (Monster, error)
	UpdateLegendaryMonster(ctx context.Context, arg UpdateLegendaryMonsterParams) (Monster, error)
}

type SessionQuerier interface {
	CreateSession(ctx context.Context, arg CreateSessionParams) (Session, error)
	DeleteSession(ctx context.Context, id uuid.UUID) error
	GetSession(ctx context.Context, id uuid.UUID) (Session, error)
	CleanExpiredSessions(ctx context.Context) error
	GetUserByUnexpiredSession(ctx context.Context, id uuid.UUID) (User, error)
	UpsertUser(ctx context.Context, arg UpsertUserParams) (User, error)
}

type CollectionQuerier interface {
	CreateCollection(ctx context.Context, arg CreateCollectionParams) (Collection, error)
	DeleteCollection(ctx context.Context, userID uuid.UUID, iD uuid.UUID) (Collection, error)
	GetCollection(ctx context.Context, id uuid.UUID) (Collection, error)
	ListCollections(ctx context.Context, userID uuid.UUID) ([]ListCollectionsRow, error)
	UpdateCollection(ctx context.Context, arg UpdateCollectionParams) (Collection, error)
	AddMonsterToCollection(ctx context.Context, monsterID uuid.UUID, collectionID uuid.UUID) error
	RemoveMonsterFromCollection(ctx context.Context, monsterID uuid.UUID, collectionID uuid.UUID) error
	ListMonstersInCollection(ctx context.Context, collectionID uuid.UUID) ([]Monster, error)
}

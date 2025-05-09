// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: monsters.sql

package sqldb

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const createLegendaryMonster = `-- name: CreateLegendaryMonster :one
INSERT INTO monsters (
    user_id, name, kind, level, hp, armor, size, actions, abilities, bloodied, last_stand, saves, legendary, action_preface, more_info
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14
) RETURNING id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
`

type CreateLegendaryMonsterParams struct {
	UserID        uuid.UUID
	Name          string
	Kind          string
	Level         string
	Hp            int32
	Armor         ArmorType
	Size          SizeType
	Actions       [][]byte
	Abilities     [][]byte
	Bloodied      string
	LastStand     string
	Saves         []string
	ActionPreface pgtype.Text
	MoreInfo      pgtype.Text
}

func (q *Queries) CreateLegendaryMonster(ctx context.Context, arg CreateLegendaryMonsterParams) (Monster, error) {
	row := q.db.QueryRow(ctx, createLegendaryMonster,
		arg.UserID,
		arg.Name,
		arg.Kind,
		arg.Level,
		arg.Hp,
		arg.Armor,
		arg.Size,
		arg.Actions,
		arg.Abilities,
		arg.Bloodied,
		arg.LastStand,
		arg.Saves,
		arg.ActionPreface,
		arg.MoreInfo,
	)
	var i Monster
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Level,
		&i.Hp,
		&i.Armor,
		&i.Size,
		&i.Speed,
		&i.Fly,
		&i.Swim,
		&i.Actions,
		&i.Abilities,
		&i.Legendary,
		&i.Bloodied,
		&i.LastStand,
		&i.Saves,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Kind,
		&i.Visibility,
		&i.FamilyID,
		&i.ActionPreface,
		&i.MoreInfo,
	)
	return i, err
}

const createMonster = `-- name: CreateMonster :one
INSERT INTO monsters (
    user_id, name, level, hp, armor, size, speed, fly, swim, family_id, actions, abilities, action_preface, more_info
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
) RETURNING id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
`

type CreateMonsterParams struct {
	UserID        uuid.UUID
	Name          string
	Level         string
	Hp            int32
	Armor         ArmorType
	Size          SizeType
	Speed         int32
	Fly           int32
	Swim          int32
	FamilyID      pgtype.UUID
	Actions       [][]byte
	Abilities     [][]byte
	ActionPreface pgtype.Text
	MoreInfo      pgtype.Text
}

func (q *Queries) CreateMonster(ctx context.Context, arg CreateMonsterParams) (Monster, error) {
	row := q.db.QueryRow(ctx, createMonster,
		arg.UserID,
		arg.Name,
		arg.Level,
		arg.Hp,
		arg.Armor,
		arg.Size,
		arg.Speed,
		arg.Fly,
		arg.Swim,
		arg.FamilyID,
		arg.Actions,
		arg.Abilities,
		arg.ActionPreface,
		arg.MoreInfo,
	)
	var i Monster
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Level,
		&i.Hp,
		&i.Armor,
		&i.Size,
		&i.Speed,
		&i.Fly,
		&i.Swim,
		&i.Actions,
		&i.Abilities,
		&i.Legendary,
		&i.Bloodied,
		&i.LastStand,
		&i.Saves,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Kind,
		&i.Visibility,
		&i.FamilyID,
		&i.ActionPreface,
		&i.MoreInfo,
	)
	return i, err
}

const deleteMonster = `-- name: DeleteMonster :one
DELETE FROM monsters WHERE id = $1 RETURNING id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
`

func (q *Queries) DeleteMonster(ctx context.Context, id uuid.UUID) (Monster, error) {
	row := q.db.QueryRow(ctx, deleteMonster, id)
	var i Monster
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Level,
		&i.Hp,
		&i.Armor,
		&i.Size,
		&i.Speed,
		&i.Fly,
		&i.Swim,
		&i.Actions,
		&i.Abilities,
		&i.Legendary,
		&i.Bloodied,
		&i.LastStand,
		&i.Saves,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Kind,
		&i.Visibility,
		&i.FamilyID,
		&i.ActionPreface,
		&i.MoreInfo,
	)
	return i, err
}

const getMonster = `-- name: GetMonster :one
SELECT id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
FROM monsters
WHERE monsters.id = $1
`

func (q *Queries) GetMonster(ctx context.Context, id uuid.UUID) (Monster, error) {
	row := q.db.QueryRow(ctx, getMonster, id)
	var i Monster
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Level,
		&i.Hp,
		&i.Armor,
		&i.Size,
		&i.Speed,
		&i.Fly,
		&i.Swim,
		&i.Actions,
		&i.Abilities,
		&i.Legendary,
		&i.Bloodied,
		&i.LastStand,
		&i.Saves,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Kind,
		&i.Visibility,
		&i.FamilyID,
		&i.ActionPreface,
		&i.MoreInfo,
	)
	return i, err
}

const listMonstersForUser = `-- name: ListMonstersForUser :many
SELECT id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
FROM monsters
WHERE user_id = $1 ORDER BY monsters.name ASC
`

func (q *Queries) ListMonstersForUser(ctx context.Context, userID uuid.UUID) ([]Monster, error) {
	rows, err := q.db.Query(ctx, listMonstersForUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Monster
	for rows.Next() {
		var i Monster
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Level,
			&i.Hp,
			&i.Armor,
			&i.Size,
			&i.Speed,
			&i.Fly,
			&i.Swim,
			&i.Actions,
			&i.Abilities,
			&i.Legendary,
			&i.Bloodied,
			&i.LastStand,
			&i.Saves,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.UserID,
			&i.Kind,
			&i.Visibility,
			&i.FamilyID,
			&i.ActionPreface,
			&i.MoreInfo,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listPublicMonsters = `-- name: ListPublicMonsters :many
SELECT id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
FROM monsters
WHERE visibility = 'public' ORDER BY monsters.name ASC
`

func (q *Queries) ListPublicMonsters(ctx context.Context) ([]Monster, error) {
	rows, err := q.db.Query(ctx, listPublicMonsters)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Monster
	for rows.Next() {
		var i Monster
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Level,
			&i.Hp,
			&i.Armor,
			&i.Size,
			&i.Speed,
			&i.Fly,
			&i.Swim,
			&i.Actions,
			&i.Abilities,
			&i.Legendary,
			&i.Bloodied,
			&i.LastStand,
			&i.Saves,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.UserID,
			&i.Kind,
			&i.Visibility,
			&i.FamilyID,
			&i.ActionPreface,
			&i.MoreInfo,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const searchMonsters = `-- name: SearchMonsters :many
SELECT m.id, m.name, m.level, m.hp, m.armor, m.size, m.speed, m.fly, m.swim, m.actions, m.abilities, m.legendary, m.bloodied, m.last_stand, m.saves, m.created_at, m.updated_at, m.user_id, m.kind, m.visibility, m.family_id, m.action_preface, m.more_info
FROM monsters m
WHERE
    similarity(lower(m.name), lower($1)) > 0.3
    OR lower(m.name) LIKE lower('%' || $1 || '%')
ORDER BY
    similarity(lower(m.name), lower($1)) DESC,
    m.name ASC
LIMIT 10
`

func (q *Queries) SearchMonsters(ctx context.Context, lower string) ([]Monster, error) {
	rows, err := q.db.Query(ctx, searchMonsters, lower)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Monster
	for rows.Next() {
		var i Monster
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Level,
			&i.Hp,
			&i.Armor,
			&i.Size,
			&i.Speed,
			&i.Fly,
			&i.Swim,
			&i.Actions,
			&i.Abilities,
			&i.Legendary,
			&i.Bloodied,
			&i.LastStand,
			&i.Saves,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.UserID,
			&i.Kind,
			&i.Visibility,
			&i.FamilyID,
			&i.ActionPreface,
			&i.MoreInfo,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateLegendaryMonster = `-- name: UpdateLegendaryMonster :one
UPDATE monsters
SET name = $2,
    kind = $3,
    level = $4,
    hp = $5,
    armor = $6,
    size = $7,
    speed = 0,
    fly = 0,
    swim = 0,
    actions = $8,
    abilities = $9,
    bloodied = $10,
    last_stand = $11,
    saves = $12,
    visibility = $13,
    action_preface = $14,
    more_info = $15
WHERE id = $1 RETURNING id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
`

type UpdateLegendaryMonsterParams struct {
	ID            uuid.UUID
	Name          string
	Kind          string
	Level         string
	Hp            int32
	Armor         ArmorType
	Size          SizeType
	Actions       [][]byte
	Abilities     [][]byte
	Bloodied      string
	LastStand     string
	Saves         []string
	Visibility    MonsterVisibility
	ActionPreface pgtype.Text
	MoreInfo      pgtype.Text
}

func (q *Queries) UpdateLegendaryMonster(ctx context.Context, arg UpdateLegendaryMonsterParams) (Monster, error) {
	row := q.db.QueryRow(ctx, updateLegendaryMonster,
		arg.ID,
		arg.Name,
		arg.Kind,
		arg.Level,
		arg.Hp,
		arg.Armor,
		arg.Size,
		arg.Actions,
		arg.Abilities,
		arg.Bloodied,
		arg.LastStand,
		arg.Saves,
		arg.Visibility,
		arg.ActionPreface,
		arg.MoreInfo,
	)
	var i Monster
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Level,
		&i.Hp,
		&i.Armor,
		&i.Size,
		&i.Speed,
		&i.Fly,
		&i.Swim,
		&i.Actions,
		&i.Abilities,
		&i.Legendary,
		&i.Bloodied,
		&i.LastStand,
		&i.Saves,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Kind,
		&i.Visibility,
		&i.FamilyID,
		&i.ActionPreface,
		&i.MoreInfo,
	)
	return i, err
}

const updateMonster = `-- name: UpdateMonster :one
UPDATE monsters
SET name = $2,
    kind = '',
    level = $3,
    hp = $4,
    armor = $5,
    size = $6,
    speed = $7,
    fly = $8,
    swim = $9,
    family_id = $10,
    actions = $11,
    abilities = $12,
    bloodied = '',
    last_stand = '',
    saves = array[]::text[],
    visibility = $13,
    action_preface = $14,
    more_info = $15
WHERE id = $1 RETURNING id, name, level, hp, armor, size, speed, fly, swim, actions, abilities, legendary, bloodied, last_stand, saves, created_at, updated_at, user_id, kind, visibility, family_id, action_preface, more_info
`

type UpdateMonsterParams struct {
	ID            uuid.UUID
	Name          string
	Level         string
	Hp            int32
	Armor         ArmorType
	Size          SizeType
	Speed         int32
	Fly           int32
	Swim          int32
	FamilyID      pgtype.UUID
	Actions       [][]byte
	Abilities     [][]byte
	Visibility    MonsterVisibility
	ActionPreface pgtype.Text
	MoreInfo      pgtype.Text
}

func (q *Queries) UpdateMonster(ctx context.Context, arg UpdateMonsterParams) (Monster, error) {
	row := q.db.QueryRow(ctx, updateMonster,
		arg.ID,
		arg.Name,
		arg.Level,
		arg.Hp,
		arg.Armor,
		arg.Size,
		arg.Speed,
		arg.Fly,
		arg.Swim,
		arg.FamilyID,
		arg.Actions,
		arg.Abilities,
		arg.Visibility,
		arg.ActionPreface,
		arg.MoreInfo,
	)
	var i Monster
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Level,
		&i.Hp,
		&i.Armor,
		&i.Size,
		&i.Speed,
		&i.Fly,
		&i.Swim,
		&i.Actions,
		&i.Abilities,
		&i.Legendary,
		&i.Bloodied,
		&i.LastStand,
		&i.Saves,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Kind,
		&i.Visibility,
		&i.FamilyID,
		&i.ActionPreface,
		&i.MoreInfo,
	)
	return i, err
}

// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: sessions.sql

package sqldb

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const cleanExpiredSessions = `-- name: CleanExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= NOW()
`

func (q *Queries) CleanExpiredSessions(ctx context.Context) error {
	_, err := q.db.Exec(ctx, cleanExpiredSessions)
	return err
}

const createSession = `-- name: CreateSession :one
INSERT INTO sessions (user_id, discord_id, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, discord_id, expires_at
`

type CreateSessionParams struct {
	UserID    uuid.UUID
	DiscordID string
	ExpiresAt pgtype.Timestamptz
}

func (q *Queries) CreateSession(ctx context.Context, arg CreateSessionParams) (Session, error) {
	row := q.db.QueryRow(ctx, createSession, arg.UserID, arg.DiscordID, arg.ExpiresAt)
	var i Session
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.DiscordID,
		&i.ExpiresAt,
	)
	return i, err
}

const deleteSession = `-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1
`

func (q *Queries) DeleteSession(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, deleteSession, id)
	return err
}

const findUsers = `-- name: FindUsers :many
SELECT id, discord_id, username, avatar, refresh_token FROM users WHERE id = ANY($1::uuid[])
`

func (q *Queries) FindUsers(ctx context.Context, dollar_1 []uuid.UUID) ([]User, error) {
	rows, err := q.db.Query(ctx, findUsers, dollar_1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
		if err := rows.Scan(
			&i.ID,
			&i.DiscordID,
			&i.Username,
			&i.Avatar,
			&i.RefreshToken,
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

const getSession = `-- name: GetSession :one
SELECT id, user_id, discord_id, expires_at FROM sessions WHERE id = $1
`

func (q *Queries) GetSession(ctx context.Context, id uuid.UUID) (Session, error) {
	row := q.db.QueryRow(ctx, getSession, id)
	var i Session
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.DiscordID,
		&i.ExpiresAt,
	)
	return i, err
}

const getUser = `-- name: GetUser :one
SELECT id, discord_id, username, avatar, refresh_token FROM users WHERE id = $1
`

func (q *Queries) GetUser(ctx context.Context, id uuid.UUID) (User, error) {
	row := q.db.QueryRow(ctx, getUser, id)
	var i User
	err := row.Scan(
		&i.ID,
		&i.DiscordID,
		&i.Username,
		&i.Avatar,
		&i.RefreshToken,
	)
	return i, err
}

const getUserByUnexpiredSession = `-- name: GetUserByUnexpiredSession :one
SELECT users.id, users.discord_id, users.username, users.avatar, users.refresh_token FROM users
JOIN sessions ON users.id = sessions.user_id
WHERE sessions.id = $1 AND sessions.expires_at >= NOW()
`

func (q *Queries) GetUserByUnexpiredSession(ctx context.Context, id uuid.UUID) (User, error) {
	row := q.db.QueryRow(ctx, getUserByUnexpiredSession, id)
	var i User
	err := row.Scan(
		&i.ID,
		&i.DiscordID,
		&i.Username,
		&i.Avatar,
		&i.RefreshToken,
	)
	return i, err
}

const upsertUser = `-- name: UpsertUser :one
INSERT INTO users (discord_id, username, avatar, refresh_token)
VALUES ($1, $2, $3, $4)
ON CONFLICT (discord_id)
DO UPDATE SET
    username = $2,
    avatar = $3,
    refresh_token = $4
RETURNING id, discord_id, username, avatar, refresh_token
`

type UpsertUserParams struct {
	DiscordID    string
	Username     string
	Avatar       pgtype.Text
	RefreshToken pgtype.Text
}

func (q *Queries) UpsertUser(ctx context.Context, arg UpsertUserParams) (User, error) {
	row := q.db.QueryRow(ctx, upsertUser,
		arg.DiscordID,
		arg.Username,
		arg.Avatar,
		arg.RefreshToken,
	)
	var i User
	err := row.Scan(
		&i.ID,
		&i.DiscordID,
		&i.Username,
		&i.Avatar,
		&i.RefreshToken,
	)
	return i, err
}

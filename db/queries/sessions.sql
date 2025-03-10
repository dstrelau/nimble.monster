-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: FindUsers :many
SELECT * FROM users WHERE id = ANY($1::uuid[]);

-- name: GetUserByUnexpiredSession :one
SELECT users.* FROM users
JOIN sessions ON users.id = sessions.user_id
WHERE sessions.id = $1 AND sessions.expires_at >= NOW();

-- name: GetSession :one
SELECT * FROM sessions WHERE id = $1;

-- name: CreateSession :one
INSERT INTO sessions (user_id, discord_id, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1;

-- name: CleanExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= NOW();

-- name: UpsertUser :one
INSERT INTO users (discord_id, username, avatar, refresh_token)
VALUES ($1, $2, $3, $4)
ON CONFLICT (discord_id)
DO UPDATE SET
    username = $2,
    avatar = $3,
    refresh_token = $4
RETURNING *;

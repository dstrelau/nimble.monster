-- name: CreateMonster :one
INSERT INTO monsters (
    name, level, hp, armor, size, speed, fly, swim, actions, abilities, user_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING *;

-- name: ListAllMonsters :many
SELECT * from monsters;

-- name: ListMonstersByUserID :many
SELECT * from monsters WHERE user_id = $1 ORDER BY name ASC;
--
-- name: GetMonster :one
SELECT * from monsters WHERE id = $1;

-- name: UpdateMonster :one
UPDATE monsters
SET name = $2,
   level = $3,
   hp = $4,
   armor = $5,
   size = $6,
   speed = $7,
   fly = $8,
   swim = $9,
   actions = $10,
   abilities = $11,
   user_id = $12
WHERE id = $1 RETURNING *;

-- name: DeleteMonster :one
DELETE FROM monsters WHERE id = $1 RETURNING *;

-- name: GetUserByDiscordID :one
SELECT * FROM users WHERE discord_id = $1;

-- name: UpsertUser :one
INSERT INTO users (discord_id, username, avatar)
VALUES ($1, $2, $3)
ON CONFLICT (discord_id)
DO UPDATE SET
    username = $2,
    avatar = $3
RETURNING *;

-- name: CreateSession :one
INSERT INTO sessions (user_id, discord_id, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetSession :one
SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW();

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1;

-- name: CleanExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= NOW();

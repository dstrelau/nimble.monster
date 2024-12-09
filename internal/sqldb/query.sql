-- name: CreateMonster :one
INSERT INTO monsters (
    user_id, name, level, hp, armor, size, speed, fly, swim, actions, abilities
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING *;

-- name: ListMonsters :many
SELECT * from monsters WHERE user_id = $1 ORDER BY name ASC;
--
-- name: GetMonster :one
SELECT * FROM monsters WHERE user_id = $1 AND id = $1;

-- name: UpdateMonster :one
UPDATE monsters
SET name = $3,
   level = $4,
   hp = $5,
   armor = $6,
   size = $7,
   speed = $8,
   fly = $9,
   swim = $10,
   actions = $11,
   abilities = $12,
   user_id = $13
WHERE user_id = $1 AND id = $2 RETURNING *;

-- name: DeleteMonster :one
DELETE FROM monsters WHERE user_id = $1 AND id = $1 RETURNING *;

-- name: CreateCollection :one
INSERT INTO collections (
    name, public, user_id
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetCollection :one
SELECT * FROM collections WHERE user_id = $1 AND id = $2;
--
-- name: ListCollections :many
SELECT * FROM collections WHERE user_id = $1;
--
-- name: DeleteCollection :one
DELETE FROM collections WHERE user_id = $1 AND id = $2 RETURNING *;
--
-- name: AddMonsterToCollection :exec
INSERT INTO monsters_collections (monster_id, collection_id) VALUES ($1, $2);
--
-- name: RemoveMonsterFromCollection :exec
DELETE FROM monsters_collections WHERE monster_id = $1 AND collection_id = $2;

-- name: UpsertUser :one
INSERT INTO users (discord_id, username, avatar)
VALUES ($1, $2, $3)
ON CONFLICT (discord_id)
DO UPDATE SET
    username = $2,
    avatar = $3
RETURNING *;

-- name: GetUserByUnexpiredSessionUUID :one
SELECT users.* FROM users
JOIN sessions ON users.id = sessions.user_id
WHERE sessions.id = $1 AND sessions.expires_at >= NOW();

-- name: GetSession :one
SELECT * FROM sessions WHERE id = $1;

-- name: CreateSession :one
INSERT INTO sessions (user_id, discord_id, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DeleteSessionUUID :exec
DELETE FROM sessions WHERE id = $1;

-- name: CleanExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= NOW();

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
SELECT * FROM monsters WHERE user_id = $1 AND id = $2;

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
DELETE FROM monsters WHERE user_id = $1 AND id = $2 RETURNING *;
--
-- name: SearchMonsters :many
SELECT m.*
FROM monsters m
WHERE
    similarity(lower(m.name), lower($1)) > 0.3
    OR lower(m.name) LIKE lower('%' || $1 || '%')
ORDER BY
    similarity(lower(m.name), lower($1)) DESC,
    m.name ASC
LIMIT 10;

-- name: CreateCollection :one
INSERT INTO collections (
    name, public, user_id
) VALUES (
    $1, $2, $3
) RETURNING *;
--
-- name: UpdateCollection :one
UPDATE collections
SET name = $3,
    public = $4
WHERE user_id = $1 AND id = $2
RETURNING *;

-- name: GetCollection :one
SELECT * FROM collections WHERE id = $1;

-- name: ListMonstersInCollection :many
SELECT monsters.* FROM monsters
JOIN monsters_collections ON monsters.id = monsters_collections.monster_id
WHERE collection_id = $1;

-- name: ListCollections :many
SELECT c.*, COUNT(mc.monster_id) as monster_count
FROM collections c
LEFT JOIN monsters_collections mc ON c.id = mc.collection_id
WHERE c.user_id = $1
GROUP BY c.id
ORDER BY c.name ASC;

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

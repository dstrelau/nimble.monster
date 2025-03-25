-- name: CreateMonster :one
INSERT INTO monsters (
    user_id, name, level, hp, armor, size, speed, fly, swim, family_id, actions, abilities, action_preface, more_info
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
) RETURNING *;

-- name: CreateLegendaryMonster :one
INSERT INTO monsters (
    user_id, name, kind, level, hp, armor, size, actions, abilities, bloodied, last_stand, saves, legendary, action_preface, more_info
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14
) RETURNING *;

-- name: ListMonstersForUser :many
SELECT *
FROM monsters
WHERE user_id = $1 ORDER BY monsters.name ASC;

-- name: ListPublicMonsters :many
SELECT *
FROM monsters
WHERE visibility = 'public' ORDER BY monsters.name ASC;

-- name: GetMonster :one
SELECT *
FROM monsters
WHERE monsters.id = $1;

-- name: UpdateMonster :one
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
WHERE id = $1 RETURNING *;

-- name: UpdateLegendaryMonster :one
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
WHERE id = $1 RETURNING *;

-- name: DeleteMonster :one
DELETE FROM monsters WHERE id = $1 RETURNING *;

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

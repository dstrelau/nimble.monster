-- name: CreateCollection :one
INSERT INTO collections (
    name, visibility, user_id, description
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: UpdateCollection :one
UPDATE collections
SET name = $3,
    visibility = $4,
    description = $5
WHERE user_id = $1 AND id = $2
RETURNING *;

-- name: GetCollection :one
SELECT sqlc.embed(c),
    COUNT(CASE WHEN m.legendary THEN 1 END) as legendary_count,
    COUNT(CASE WHEN NOT m.legendary THEN 1 END) as standard_count
FROM collections c
LEFT JOIN monsters_collections mc ON c.id = mc.collection_id
LEFT JOIN monsters m ON mc.monster_id = m.id
WHERE c.id = $1
GROUP BY c.id;

-- name: ListMonstersInCollection :many
SELECT monsters.*
FROM monsters
JOIN monsters_collections ON monsters.id = monsters_collections.monster_id
WHERE collection_id = $1;

-- name: ListCollections :many
SELECT sqlc.embed(c),
  COUNT(CASE WHEN m.legendary THEN 1 END) as legendary_count,
  COUNT(CASE WHEN NOT m.legendary THEN 1 END) as standard_count
FROM collections c
LEFT JOIN monsters_collections mc ON c.id = mc.collection_id
LEFT JOIN monsters m ON mc.monster_id = m.id
WHERE c.user_id = $1
GROUP BY c.id
ORDER BY c.name ASC;

-- name: ListPublicCollections :many
SELECT sqlc.embed(c),
  COUNT(CASE WHEN m.legendary THEN 1 END) as legendary_count,
  COUNT(CASE WHEN NOT m.legendary THEN 1 END) as standard_count
FROM collections c
LEFT JOIN monsters_collections mc ON c.id = mc.collection_id
LEFT JOIN monsters m ON mc.monster_id = m.id
WHERE c.visibility = 'public'
GROUP BY c.id
ORDER BY c.name ASC;

-- name: DeleteCollection :one
DELETE FROM collections WHERE id = $1 RETURNING *;
--
-- name: AddMonsterToCollection :exec
INSERT INTO monsters_collections (monster_id, collection_id) VALUES ($1, $2);
--
-- name: RemoveMonsterFromCollection :exec
DELETE FROM monsters_collections WHERE monster_id = $1 AND collection_id = $2;

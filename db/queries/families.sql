-- name: GetFamily :one
SELECT sqlc.embed(f), (
    SELECT COUNT(*) FROM monsters WHERE family_id = f.id
) as monster_count
FROM families f WHERE f.id = $1;

-- name: FindFamilies :many
SELECT * FROM families WHERE id = ANY($1::uuid[]);

-- name: ListFamiliesForUser :many
SELECT sqlc.embed(f), (
    SELECT COUNT(*) FROM monsters WHERE family_id = f.id
) as monster_count
FROM families f
WHERE f.user_id = $1
ORDER BY name ASC;

-- name: ListPublicFamilies :many
SELECT sqlc.embed(f), (
    SELECT COUNT(*) FROM monsters WHERE family_id = f.id
) as monster_count
FROM families f
WHERE visibility = 'public'
ORDER BY name ASC;

-- name: CreateFamily :one
INSERT INTO families (
  user_id,
  name,
  abilities,
  visibility
) VALUES (
  $1, $2, $3, $4
)
RETURNING *;

-- name: UpdateFamily :one
UPDATE families
SET
  name = $2,
  abilities = $3,
  visibility = $4,
  updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteFamily :exec
DELETE FROM families
WHERE id = $1;

-- name: CountMonstersInFamily :one
SELECT COUNT(*) FROM monsters WHERE family_id = $1;

CREATE TYPE monster_visibility AS ENUM ('public', 'private');

ALTER TABLE monsters
ADD COLUMN visibility monster_visibility NOT NULL DEFAULT 'public';

UPDATE monsters
SET
    visibility = 'private';

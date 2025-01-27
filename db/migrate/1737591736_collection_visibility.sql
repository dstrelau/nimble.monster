CREATE TYPE collection_visibility AS ENUM ('public', 'secret', 'private');

ALTER TABLE collections
ADD COLUMN visibility collection_visibility NOT NULL DEFAULT 'public';

UPDATE collections
SET
    visibility = 'secret'
WHERE
    public = true;

UPDATE collections
SET
    visibility = 'private'
WHERE
    public = false;

ALTER TABLE monsters
ALTER COLUMN size
SET
    NOT NULL,
ALTER column armor
SET DEFAULT 'none',
ALTER column armor
SET
    NOT NULL,
ALTER column user_id
SET
    NOT NULL;

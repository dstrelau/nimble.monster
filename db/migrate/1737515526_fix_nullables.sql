UPDATE monsters
SET
    bloodied = ''
WHERE
    bloodied IS NULL;

ALTER TABLE monsters
ALTER COLUMN bloodied
SET
    NOT NULL;

ALTER TABLE monsters
ALTER COLUMN bloodied
SET DEFAULT '',
ALTER COLUMN bloodied
SET
    NOT NULL;

UPDATE monsters
SET
    last_stand = ''
WHERE
    last_stand IS NULL;

ALTER TABLE monsters
ALTER COLUMN last_stand
SET DEFAULT '',
ALTER COLUMN last_stand
SET
    NOT NULL;

UPDATE monsters
SET
    speed = 0
WHERE
    speed IS NULL;

ALTER TABLE monsters
ALTER COLUMN speed
SET DEFAULT 0,
ALTER COLUMN speed
SET
    NOT NULL;

UPDATE monsters
SET
    fly = 0
WHERE
    fly IS NULL;

ALTER TABLE monsters
ALTER COLUMN fly
SET DEFAULT 0,
ALTER COLUMN fly
SET
    NOT NULL;

UPDATE monsters
SET
    swim = 0
WHERE
    swim IS NULL;

ALTER TABLE monsters
ALTER COLUMN swim
SET DEFAULT 0,
ALTER COLUMN swim
SET
    NOT NULL;

ALTER TABLE monsters
ALTER COLUMN created_at
SET
    NOT NULL,
ALTER COLUMN updated_at
SET
    NOT NULL;

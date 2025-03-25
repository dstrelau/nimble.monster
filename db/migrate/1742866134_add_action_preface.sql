ALTER TABLE monsters
ADD COLUMN action_preface TEXT;

UPDATE monsters
SET
    action_preface = 'After each hero''s turn, choose one.'
WHERE
    legendary = true;

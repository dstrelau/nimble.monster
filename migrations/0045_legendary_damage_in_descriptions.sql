-- The legendary editor never offered a damage input, so legendary cards no
-- longer display stored damage rolls. Prefix each roll to its action's
-- description the way cards rendered it, and keep the roll itself.
UPDATE monsters SET actions = (
  SELECT json_group_array(
    CASE
      WHEN trim(coalesce(json_extract(value, '$.damage'), '')) = ''
        THEN json(value)
      WHEN trim(coalesce(json_extract(value, '$.description'), '')) = ''
        THEN json_set(value, '$.description', json_extract(value, '$.damage'))
      ELSE json_set(value, '$.description',
        CASE
          WHEN substr(json_extract(value, '$.damage'), -1) IN ('.', '!', '?')
            THEN json_extract(value, '$.damage')
          ELSE json_extract(value, '$.damage') || '.'
        END || ' ' || json_extract(value, '$.description'))
    END
  ) FROM json_each(monsters.actions)
) WHERE legendary = 1
  AND json_valid(actions) AND json_type(actions) = 'array'
  AND EXISTS (
    SELECT 1 FROM json_each(monsters.actions)
    WHERE trim(coalesce(json_extract(value, '$.damage'), '')) <> ''
  );

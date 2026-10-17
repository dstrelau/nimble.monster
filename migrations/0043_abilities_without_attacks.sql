-- Abilities are name/description text, not structured attacks. Actions are unchanged.
UPDATE monsters SET abilities = (
  SELECT json_group_array(json_remove(value,
    '$.target', '$.area', '$.aoe', '$.attackCount', '$.alternative', '$.damage', '$.range'))
  FROM json_each(monsters.abilities)
) WHERE json_valid(abilities) AND json_type(abilities) = 'array';
--> statement-breakpoint
UPDATE families SET abilities = (
  SELECT json_group_array(json_remove(value,
    '$.target', '$.area', '$.aoe', '$.attackCount', '$.alternative', '$.damage', '$.range'))
  FROM json_each(families.abilities)
) WHERE json_valid(abilities) AND json_type(abilities) = 'array';
--> statement-breakpoint
UPDATE companions SET abilities = (
  SELECT json_group_array(json_remove(value,
    '$.target', '$.area', '$.aoe', '$.attackCount', '$.alternative', '$.damage', '$.range'))
  FROM json_each(companions.abilities)
) WHERE json_valid(abilities) AND json_type(abilities) = 'array';
--> statement-breakpoint
UPDATE monsters SET members = (
  SELECT json_group_array(
    CASE WHEN json_type(member.value, '$.abilities') = 'array'
    THEN json_set(member.value, '$.abilities', (
      SELECT json_group_array(json_remove(ability.value,
        '$.target', '$.area', '$.aoe', '$.attackCount', '$.alternative', '$.damage', '$.range'))
      FROM json_each(member.value, '$.abilities') AS ability
    )) ELSE json(member.value) END
  ) FROM json_each(monsters.members) AS member
) WHERE json_valid(members) AND json_type(members) = 'array';

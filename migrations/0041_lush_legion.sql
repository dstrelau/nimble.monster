ALTER TABLE `spells` ADD `version` integer DEFAULT 3 NOT NULL;
--> statement-breakpoint
UPDATE `spells`
SET `version` = 2
WHERE EXISTS (
  SELECT 1 FROM `spell_schools` AS school
  WHERE school.id = spells.school_id
    AND school.user_id = '00000000-0000-0000-0000-000000000000'
    AND (
      (school.name = 'Fire Spells' AND spells.name = 'Hearth & Home')
      OR (school.name = 'Ice Spells' AND spells.name IN ('Cryosleep', 'Cryotomb'))
      OR (school.name = 'Lightning Spells' AND spells.name IN ('Sparkfetch', 'Teleport'))
      OR (school.name = 'Necrotic Spells' AND spells.name IN ('Shadow Blast', 'Summon Shadow', 'Memory Veil', 'Greater Shadow', 'Speak With Dead'))
      OR (school.name = 'Radiant Spells' AND spells.name IN ('Lifebinding Spirit', 'Radiant Bond', 'Revive'))
      OR (school.name = 'Wind Spells' AND spells.name IN ('Lesser Windform', 'Vicious Mockery', 'Fly', 'Greater Windform'))
    )
);

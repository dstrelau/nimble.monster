ALTER TABLE `collections` ADD `featured_sequence` integer;--> statement-breakpoint
-- One-time backfill: every Monstery Monday name is "Monstery Monday Week N - Theme".
-- CAST reads the leading digits after "Week ". Names without a positive week
-- number, or whose number another collection shares, stay NULL so the unique
-- index below cannot fail.
WITH parsed AS (
  SELECT `id`, CAST(substr(`name`, instr(`name`, 'Week ') + 5) AS INTEGER) AS `n`
  FROM `collections`
  WHERE `featured_collection` = 'monstery monday' AND instr(`name`, 'Week ') > 0
),
distinct_weeks AS (
  SELECT `id`, `n` FROM parsed
  WHERE `n` > 0 AND `n` IN (SELECT `n` FROM parsed GROUP BY `n` HAVING count(*) = 1)
)
UPDATE `collections`
SET `featured_sequence` = (SELECT `n` FROM distinct_weeks WHERE distinct_weeks.`id` = `collections`.`id`)
WHERE `id` IN (SELECT `id` FROM distinct_weeks);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_collections_featured_sequence` ON `collections` (`featured_collection`,`featured_sequence`);

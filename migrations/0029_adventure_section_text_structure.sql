-- Preserve each section body as its first text child, ahead of existing children.
UPDATE `adventure_nodes`
SET `order_index` = `order_index` + 1
WHERE `parent_id` IN (
	SELECT `id`
	FROM `adventure_nodes`
	WHERE `kind` = 'section' AND `content` <> ''
);
--> statement-breakpoint
INSERT INTO `adventure_nodes` (
	`id`,
	`adventure_id`,
	`parent_id`,
	`kind`,
	`order_index`,
	`title`,
	`content`,
	`created_at`,
	`updated_at`
)
SELECT
	'section-text-' || `id`,
	`adventure_id`,
	`id`,
	'text',
	0,
	'',
	`content`,
	`created_at`,
	`updated_at`
FROM `adventure_nodes`
WHERE `kind` = 'section' AND `content` <> '';
--> statement-breakpoint
UPDATE `adventure_nodes`
SET `content` = ''
WHERE `kind` = 'section' AND `content` <> '';
--> statement-breakpoint
-- Wrap legacy non-section roots individually to retain their relative ordering.
INSERT INTO `adventure_nodes` (
	`id`,
	`adventure_id`,
	`parent_id`,
	`kind`,
	`order_index`,
	`title`,
	`content`,
	`created_at`,
	`updated_at`
)
SELECT
	'root-section-' || `node`.`id`,
	`node`.`adventure_id`,
	NULL,
	'section',
	`node`.`order_index`,
	substr(CASE
		WHEN trim(`node`.`title`) <> '' THEN trim(`node`.`title`)
		WHEN `node`.`kind` = 'text' THEN 'Text'
		WHEN `node`.`kind` = 'callout' THEN 'Callout'
		WHEN `node`.`kind` = 'image' AND trim(`node`.`caption`) <> '' THEN trim(`node`.`caption`)
		WHEN `node`.`kind` = 'image' THEN 'Image'
		WHEN `node`.`kind` = 'encounter' THEN coalesce(
			(SELECT `name` FROM `encounters` WHERE `id` = `node`.`encounter_id`),
			'Encounter'
		)
		WHEN `node`.`kind` = 'monsters' THEN 'Monsters'
		WHEN `node`.`kind` = 'items' THEN 'Items'
		ELSE 'Section'
	END, 1, 300),
	'',
	`node`.`created_at`,
	`node`.`updated_at`
FROM `adventure_nodes` AS `node`
WHERE `node`.`parent_id` IS NULL AND `node`.`kind` <> 'section';
--> statement-breakpoint
UPDATE `adventure_nodes`
SET
	`parent_id` = 'root-section-' || `id`,
	`order_index` = 0,
	`title` = ''
WHERE `parent_id` IS NULL AND `kind` <> 'section';

-- Preserve legacy roll ranges and results as ordinary table cells.
CREATE TABLE `__new_random_subtables` (
	`id` text PRIMARY KEY NOT NULL,
	`random_table_id` text NOT NULL,
	`title` text NOT NULL,
	`columns` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`random_table_id`) REFERENCES `random_tables`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_random_subtables` (`id`, `random_table_id`, `title`, `columns`, `order_index`)
SELECT
	`id`,
	`random_table_id`,
	`title`,
	json_array(
		json_object('id', 'roll', 'name', `notation`),
		json_object('id', 'result', 'name', 'Result')
	),
	`order_index`
FROM `random_subtables`;
--> statement-breakpoint
CREATE TABLE `__new_random_subtable_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`subtable_id` text NOT NULL,
	`cells` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`subtable_id`) REFERENCES `__new_random_subtables`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_random_subtable_rows` (`id`, `subtable_id`, `cells`, `order_index`)
SELECT
	`id`,
	`subtable_id`,
	json_object(
		'roll',
		CASE
			WHEN `low` = `high` THEN CAST(`low` AS text)
			ELSE CAST(`low` AS text) || '–' || CAST(`high` AS text)
		END,
		'result',
		`result`
	),
	`order_index`
FROM `random_subtable_rows`;
--> statement-breakpoint
DROP TABLE `random_subtable_rows`;
--> statement-breakpoint
DROP TABLE `random_subtables`;
--> statement-breakpoint
ALTER TABLE `__new_random_subtables` RENAME TO `random_subtables`;
--> statement-breakpoint
CREATE INDEX `idx_random_subtables_random_table_id` ON `random_subtables` (`random_table_id`);
--> statement-breakpoint
ALTER TABLE `__new_random_subtable_rows` RENAME TO `random_subtable_rows`;
--> statement-breakpoint
CREATE INDEX `idx_random_subtable_rows_subtable_id` ON `random_subtable_rows` (`subtable_id`);

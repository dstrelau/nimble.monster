ALTER TABLE `random_subtables` ADD `official_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `random_subtables_official_id_unique` ON `random_subtables` (`official_id`);--> statement-breakpoint
ALTER TABLE `random_tables` ADD `official_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `random_tables_official_id_unique` ON `random_tables` (`official_id`);
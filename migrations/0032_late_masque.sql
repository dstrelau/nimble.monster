CREATE TABLE `random_subtable_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`subtable_id` text NOT NULL,
	`low` integer NOT NULL,
	`high` integer NOT NULL,
	`result` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`subtable_id`) REFERENCES `random_subtables`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_random_subtable_rows_subtable_id` ON `random_subtable_rows` (`subtable_id`);--> statement-breakpoint
CREATE TABLE `random_subtables` (
	`id` text PRIMARY KEY NOT NULL,
	`random_table_id` text NOT NULL,
	`title` text NOT NULL,
	`notation` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`random_table_id`) REFERENCES `random_tables`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_random_subtables_random_table_id` ON `random_subtables` (`random_table_id`);--> statement-breakpoint
CREATE TABLE `random_tables` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'public',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_random_tables_user_id` ON `random_tables` (`user_id`);
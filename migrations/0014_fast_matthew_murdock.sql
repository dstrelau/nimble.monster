CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'public',
	`hero_count` integer DEFAULT 4 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_encounters_user_id` ON `encounters` (`user_id`);--> statement-breakpoint
CREATE TABLE `monsters_encounters` (
	`monster_id` text NOT NULL,
	`encounter_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`is_per_hero` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`monster_id`, `encounter_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE cascade ON DELETE cascade
);

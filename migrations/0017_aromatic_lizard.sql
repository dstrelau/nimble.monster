CREATE TABLE `reactions` (
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reaction_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`entity_type`, `entity_id`, `user_id`, `reaction_type`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reactions_entity` ON `reactions` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reports_entity` ON `reports` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reports_entity_type_entity_id_user_id_unique` ON `reports` (`entity_type`,`entity_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `monsters` ADD `like_count` integer DEFAULT 0 NOT NULL;
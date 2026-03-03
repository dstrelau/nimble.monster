CREATE TABLE `class_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`class_id` text DEFAULT '__new__' NOT NULL,
	`data` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_class_drafts_user_id` ON `class_drafts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_drafts_user_id_class_id_unique` ON `class_drafts` (`user_id`,`class_id`);

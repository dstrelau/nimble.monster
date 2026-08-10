CREATE TABLE `adventure_images` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`extension` text NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_adventure_images_user_id` ON `adventure_images` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_adventure_images_status_created_at` ON `adventure_images` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `adventure_nodes` ADD `image_id` text REFERENCES adventure_images(id) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `adventure_nodes` ADD `image_extension` text;--> statement-breakpoint
ALTER TABLE `adventure_nodes` ADD `caption` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `adventure_nodes_image_id_unique` ON `adventure_nodes` (`image_id`);

CREATE TABLE `adventure_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`adventure_id` text NOT NULL,
	`parent_id` text,
	`kind` text NOT NULL,
	`order_index` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`encounter_id` text,
	`monster_id` text,
	`item_id` text,
	`presentation` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `adventure_nodes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_adventure_nodes_parent_order` ON `adventure_nodes` (`adventure_id`,`parent_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `idx_adventure_nodes_encounter_id` ON `adventure_nodes` (`encounter_id`);--> statement-breakpoint
CREATE INDEX `idx_adventure_nodes_monster_id` ON `adventure_nodes` (`monster_id`);--> statement-breakpoint
CREATE INDEX `idx_adventure_nodes_item_id` ON `adventure_nodes` (`item_id`);--> statement-breakpoint
CREATE TABLE `adventures` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_id` text,
	`remixed_from_id` text,
	`name` text NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`remixed_from_id`) REFERENCES `adventures`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_adventures_user_id` ON `adventures` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_adventures_visibility_updated_at` ON `adventures` (`visibility`,`updated_at`);

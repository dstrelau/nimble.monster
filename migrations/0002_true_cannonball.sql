CREATE TABLE `class_abilities` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`level` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_class_abilities_class_level_order` ON `class_abilities` (`class_id`,`level`,`order_index`);--> statement-breakpoint
CREATE TABLE `class_ability_items` (
	`id` text PRIMARY KEY NOT NULL,
	`class_ability_list_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`class_ability_list_id`) REFERENCES `class_ability_lists`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_class_ability_items_list_order` ON `class_ability_items` (`class_ability_list_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `class_ability_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`character_class` text,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_class_ability_lists_user_id` ON `class_ability_lists` (`user_id`);--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`key_stats` text DEFAULT '[]' NOT NULL,
	`hit_die` text NOT NULL,
	`starting_hp` integer NOT NULL,
	`saves` text DEFAULT '{}' NOT NULL,
	`armor` text DEFAULT '[]' NOT NULL,
	`weapons` text DEFAULT '{}' NOT NULL,
	`starting_gear` text DEFAULT '[]' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`user_id` text NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_classes_user_id` ON `classes` (`user_id`);--> statement-breakpoint
CREATE TABLE `classes_awards` (
	`class_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`class_id`, `award_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classes_class_ability_lists` (
	`class_id` text NOT NULL,
	`ability_list_id` text NOT NULL,
	`order_index` integer NOT NULL,
	PRIMARY KEY(`class_id`, `ability_list_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`ability_list_id`) REFERENCES `class_ability_lists`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_class_ability_list_links_class_order` ON `classes_class_ability_lists` (`class_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `subclasses_class_ability_lists` (
	`subclass_id` text NOT NULL,
	`ability_list_id` text NOT NULL,
	`order_index` integer NOT NULL,
	PRIMARY KEY(`subclass_id`, `ability_list_id`),
	FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`ability_list_id`) REFERENCES `class_ability_lists`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_subclass_ability_list_links_subclass_order` ON `subclasses_class_ability_lists` (`subclass_id`,`order_index`);
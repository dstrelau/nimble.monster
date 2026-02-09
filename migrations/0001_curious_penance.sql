CREATE TABLE `ancestries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`abilities` text DEFAULT '[]' NOT NULL,
	`size` text DEFAULT '' NOT NULL,
	`rarity` text DEFAULT 'common',
	`visibility` text DEFAULT 'public',
	`user_id` text NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ancestries_user_id` ON `ancestries` (`user_id`);--> statement-breakpoint
CREATE TABLE `ancestries_awards` (
	`ancestry_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`ancestry_id`, `award_id`),
	FOREIGN KEY (`ancestry_id`) REFERENCES `ancestries`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ancestries_collections` (
	`ancestry_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`ancestry_id`, `collection_id`),
	FOREIGN KEY (`ancestry_id`) REFERENCES `ancestries`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `awards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`url` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `awards_slug_unique` ON `awards` (`slug`);--> statement-breakpoint
CREATE TABLE `backgrounds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`requirement` text,
	`visibility` text DEFAULT 'public',
	`user_id` text NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_backgrounds_user_id` ON `backgrounds` (`user_id`);--> statement-breakpoint
CREATE TABLE `backgrounds_awards` (
	`background_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`background_id`, `award_id`),
	FOREIGN KEY (`background_id`) REFERENCES `backgrounds`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `backgrounds_collections` (
	`background_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`background_id`, `collection_id`),
	FOREIGN KEY (`background_id`) REFERENCES `backgrounds`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`public` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`description` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'public',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_collections_user_id` ON `collections` (`user_id`);--> statement-breakpoint
CREATE TABLE `companions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT '' NOT NULL,
	`class` text DEFAULT '' NOT NULL,
	`hp_per_level` text NOT NULL,
	`wounds` integer DEFAULT 0 NOT NULL,
	`size` text DEFAULT 'medium' NOT NULL,
	`saves` text DEFAULT '' NOT NULL,
	`actions` text DEFAULT '[]' NOT NULL,
	`abilities` text DEFAULT '[]' NOT NULL,
	`action_preface` text,
	`dying_rule` text DEFAULT '' NOT NULL,
	`more_info` text DEFAULT '',
	`visibility` text DEFAULT 'public',
	`user_id` text NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_companions_user_id` ON `companions` (`user_id`);--> statement-breakpoint
CREATE TABLE `companions_awards` (
	`companion_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`companion_id`, `award_id`),
	FOREIGN KEY (`companion_id`) REFERENCES `companions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `companions_collections` (
	`companion_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`companion_id`, `collection_id`),
	FOREIGN KEY (`companion_id`) REFERENCES `companions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`official` integer DEFAULT false NOT NULL,
	`creator_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entity_images` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`blob_url` text,
	`generated_at` text,
	`entity_version` text NOT NULL,
	`generation_status` text DEFAULT 'generating',
	`generation_started_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_entity_images_status_started` ON `entity_images` (`generation_status`,`generation_started_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `entity_images_entity_type_entity_id_unique` ON `entity_images` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`visibility` text DEFAULT 'public',
	`name` text NOT NULL,
	`abilities` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`description` text,
	`featured` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`more_info` text DEFAULT '',
	`visibility` text DEFAULT 'public',
	`user_id` text NOT NULL,
	`source_id` text,
	`remixed_from_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`image_icon` text,
	`rarity` text DEFAULT 'unspecified',
	`image_bg_icon` text,
	`image_color` text,
	`image_bg_color` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_items_user_id` ON `items` (`user_id`);--> statement-breakpoint
CREATE TABLE `items_awards` (
	`item_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`item_id`, `award_id`),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `items_collections` (
	`item_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`item_id`, `collection_id`),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monsters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_id` text,
	`remixed_from_id` text,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`hp` integer NOT NULL,
	`armor` text NOT NULL,
	`size` text DEFAULT 'medium' NOT NULL,
	`speed` integer DEFAULT 0 NOT NULL,
	`fly` integer DEFAULT 0 NOT NULL,
	`swim` integer DEFAULT 0 NOT NULL,
	`actions` text DEFAULT '[]' NOT NULL,
	`abilities` text DEFAULT '[]' NOT NULL,
	`legendary` integer DEFAULT false,
	`bloodied` text DEFAULT '' NOT NULL,
	`last_stand` text DEFAULT '' NOT NULL,
	`saves` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`kind` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'public',
	`action_preface` text,
	`more_info` text DEFAULT '',
	`burrow` integer DEFAULT 0 NOT NULL,
	`climb` integer DEFAULT 0 NOT NULL,
	`teleport` integer DEFAULT 0 NOT NULL,
	`minion` integer DEFAULT false NOT NULL,
	`level_int` integer DEFAULT 0 NOT NULL,
	`role` text,
	`paperforge_id` text,
	`is_official` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_monsters_user_id` ON `monsters` (`user_id`);--> statement-breakpoint
CREATE TABLE `monsters_awards` (
	`monster_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`monster_id`, `award_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monsters_collections` (
	`monster_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`monster_id`, `collection_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monsters_conditions` (
	`monster_id` text NOT NULL,
	`condition_id` text NOT NULL,
	`inline` integer NOT NULL,
	PRIMARY KEY(`monster_id`, `condition_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`condition_id`) REFERENCES `conditions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monsters_families` (
	`monster_id` text NOT NULL,
	`family_id` text NOT NULL,
	PRIMARY KEY(`monster_id`, `family_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`license` text NOT NULL,
	`link` text NOT NULL,
	`abbreviation` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `spell_schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'public',
	`user_id` text NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_spell_schools_user_id` ON `spell_schools` (`user_id`);--> statement-breakpoint
CREATE TABLE `spell_schools_awards` (
	`school_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`school_id`, `award_id`),
	FOREIGN KEY (`school_id`) REFERENCES `spell_schools`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spell_schools_collections` (
	`spell_school_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`spell_school_id`, `collection_id`),
	FOREIGN KEY (`spell_school_id`) REFERENCES `spell_schools`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spells` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`tier` integer DEFAULT 0 NOT NULL,
	`actions` integer DEFAULT 1 NOT NULL,
	`reaction` integer DEFAULT false NOT NULL,
	`target_type` text,
	`target_kind` text,
	`target_distance` integer,
	`damage` text,
	`description` text,
	`high_levels` text,
	`concentration` text,
	`upcast` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`school_id`) REFERENCES `spell_schools`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_spells_school_id` ON `spells` (`school_id`);--> statement-breakpoint
CREATE TABLE `subclass_abilities` (
	`id` text PRIMARY KEY NOT NULL,
	`subclass_id` text NOT NULL,
	`level` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_subclass_abilities_subclass_id` ON `subclass_abilities` (`subclass_id`);--> statement-breakpoint
CREATE TABLE `subclasses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`class_name` text NOT NULL,
	`name_preface` text,
	`description` text,
	`visibility` text DEFAULT 'public',
	`user_id` text NOT NULL,
	`source_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`tagline` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_subclasses_user_id` ON `subclasses` (`user_id`);--> statement-breakpoint
CREATE TABLE `subclasses_awards` (
	`subclass_id` text NOT NULL,
	`award_id` text NOT NULL,
	PRIMARY KEY(`subclass_id`, `award_id`),
	FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subclasses_collections` (
	`subclass_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`subclass_id`, `collection_id`),
	FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text,
	`username` text,
	`avatar` text,
	`refresh_token` text,
	`display_name` text,
	`image_url` text,
	`role` text,
	`name` text DEFAULT '' NOT NULL,
	`email` text,
	`email_verified` integer DEFAULT false,
	`banner_dismissed` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE TABLE `__legacy_adventure_statblocks` (
	`node_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`monster_id` text,
	`item_id` text
);
--> statement-breakpoint
INSERT INTO `__legacy_adventure_statblocks` (`node_id`, `kind`, `monster_id`, `item_id`)
SELECT
	`id`,
	CASE WHEN `monster_id` IS NOT NULL OR `item_id` IS NULL THEN 'monsters' ELSE 'items' END,
	`monster_id`,
	`item_id`
FROM `adventure_nodes`
WHERE `kind` = 'statblock';
--> statement-breakpoint
CREATE TABLE `__new_adventure_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`adventure_id` text NOT NULL,
	`parent_id` text,
	`kind` text NOT NULL,
	`order_index` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`encounter_id` text,
	`image_id` text,
	`image_extension` text,
	`caption` text DEFAULT '' NOT NULL,
	`presentation` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `__new_adventure_nodes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`image_id`) REFERENCES `adventure_images`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_adventure_nodes` (`id`, `adventure_id`, `parent_id`, `kind`, `order_index`, `title`, `content`, `encounter_id`, `image_id`, `image_extension`, `caption`, `presentation`, `created_at`, `updated_at`)
SELECT
	`id`,
	`adventure_id`,
	`parent_id`,
	CASE
		WHEN `kind` = 'statblock' AND (`monster_id` IS NOT NULL OR `item_id` IS NULL) THEN 'monsters'
		WHEN `kind` = 'statblock' THEN 'items'
		ELSE `kind`
	END,
	`order_index`,
	`title`,
	`content`,
	`encounter_id`,
	`image_id`,
	`image_extension`,
	`caption`,
	`presentation`,
	`created_at`,
	`updated_at`
FROM `adventure_nodes`;
--> statement-breakpoint
DROP TABLE `adventure_nodes`;
--> statement-breakpoint
ALTER TABLE `__new_adventure_nodes` RENAME TO `adventure_nodes`;
--> statement-breakpoint
CREATE UNIQUE INDEX `adventure_nodes_image_id_unique` ON `adventure_nodes` (`image_id`);
--> statement-breakpoint
CREATE INDEX `idx_adventure_nodes_parent_order` ON `adventure_nodes` (`adventure_id`, `parent_id`, `order_index`);
--> statement-breakpoint
CREATE INDEX `idx_adventure_nodes_encounter_id` ON `adventure_nodes` (`encounter_id`);
--> statement-breakpoint
CREATE TABLE `adventure_node_items` (
	`node_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`item_id` text,
	PRIMARY KEY(`node_id`, `order_index`),
	FOREIGN KEY (`node_id`) REFERENCES `adventure_nodes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_adventure_node_items_item_id` ON `adventure_node_items` (`item_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `adventure_node_items_node_entity_unique` ON `adventure_node_items` (`node_id`,`item_id`);
--> statement-breakpoint
CREATE TABLE `adventure_node_monsters` (
	`node_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`monster_id` text,
	PRIMARY KEY(`node_id`, `order_index`),
	FOREIGN KEY (`node_id`) REFERENCES `adventure_nodes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_adventure_node_monsters_monster_id` ON `adventure_node_monsters` (`monster_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `adventure_node_monsters_node_entity_unique` ON `adventure_node_monsters` (`node_id`,`monster_id`);
--> statement-breakpoint
INSERT INTO `adventure_node_monsters` (`node_id`, `order_index`, `monster_id`)
SELECT `node_id`, 0, `monster_id`
FROM `__legacy_adventure_statblocks`
WHERE `kind` = 'monsters';
--> statement-breakpoint
INSERT INTO `adventure_node_items` (`node_id`, `order_index`, `item_id`)
SELECT `node_id`, 0, `item_id`
FROM `__legacy_adventure_statblocks`
WHERE `kind` = 'items';
--> statement-breakpoint
DROP TABLE `__legacy_adventure_statblocks`;

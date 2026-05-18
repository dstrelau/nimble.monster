DROP INDEX `entity_images_entity_type_entity_id_unique`;--> statement-breakpoint
ALTER TABLE `entity_images` ADD `theme` text DEFAULT 'light' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `entity_images_entity_type_entity_id_theme_unique` ON `entity_images` (`entity_type`,`entity_id`,`theme`);
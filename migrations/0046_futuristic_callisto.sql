CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text DEFAULT '__new__' NOT NULL,
	`data` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_drafts_user_id` ON `drafts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `drafts_user_id_entity_type_entity_id_unique` ON `drafts` (`user_id`,`entity_type`,`entity_id`);--> statement-breakpoint
-- Class and subclass drafts shared one table keyed only by ID; subclass rows are
-- the ones whose ID is a subclass. Unsaved "__new__" drafts cannot be told
-- apart, so they stay with classes.
INSERT INTO `drafts` (`id`, `user_id`, `entity_type`, `entity_id`, `data`, `created_at`, `updated_at`)
SELECT `id`, `user_id`,
	CASE WHEN `class_id` IN (SELECT `id` FROM `subclasses`) THEN 'subclass' ELSE 'class' END,
	`class_id`, `data`, `created_at`, `updated_at`
FROM `class_drafts`;--> statement-breakpoint
DROP TABLE `class_drafts`;--> statement-breakpoint
UPDATE `user_feature_flags` SET `feature` = 'draft-autosave' WHERE `feature` = 'class-draft-autosave';
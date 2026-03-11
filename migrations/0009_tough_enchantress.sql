ALTER TABLE `classes` ADD `subclass_name_preface` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `subclasses` ADD `class_id` text;--> statement-breakpoint
CREATE INDEX `idx_subclasses_class_id` ON `subclasses` (`class_id`);
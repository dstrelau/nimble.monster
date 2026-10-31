-- Sources are official publications, attached only by the official importer.
-- Clear any source that users attached to their own content.
UPDATE `monsters` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `items` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `companions` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `subclasses` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `spell_schools` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `backgrounds` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `ancestries` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `classes` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `class_ability_lists` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `adventures` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `random_tables` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `user_id` IS NOT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
UPDATE `global_search_catalog` SET `source_id` = NULL WHERE `source_id` IS NOT NULL AND `creator_id` IS NOT '00000000-0000-0000-0000-000000000000';

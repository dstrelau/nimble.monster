ALTER TABLE `class_ability_lists` ADD `source_id` text REFERENCES sources(id);--> statement-breakpoint
ALTER TABLE `spells` ADD `utility` integer DEFAULT false NOT NULL;
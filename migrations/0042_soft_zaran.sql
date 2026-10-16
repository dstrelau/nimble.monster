ALTER TABLE `monsters` ADD `creature_types` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `monsters` ADD `creature_groups` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `monsters` ADD `environments` text DEFAULT '[]' NOT NULL;
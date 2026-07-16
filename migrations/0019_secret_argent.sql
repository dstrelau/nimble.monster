ALTER TABLE `monsters` ADD `version_number` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `monsters` ADD `version_description` text;--> statement-breakpoint
ALTER TABLE `monsters` ADD `versions` text DEFAULT '[]' NOT NULL;
ALTER TABLE `adventures` ADD `like_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `like_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `encounters` ADD `like_count` integer DEFAULT 0 NOT NULL;
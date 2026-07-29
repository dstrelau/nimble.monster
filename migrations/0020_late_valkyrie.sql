CREATE TABLE `custom_rule_links` (
	`custom_rule_id` text NOT NULL,
	`rule_slug` text NOT NULL,
	`relation` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`custom_rule_id`, `rule_slug`),
	FOREIGN KEY (`custom_rule_id`) REFERENCES `custom_rules`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_custom_rule_links_rule_slug` ON `custom_rule_links` (`rule_slug`);--> statement-breakpoint
CREATE TABLE `custom_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_custom_rules_user_id` ON `custom_rules` (`user_id`);
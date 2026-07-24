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
CREATE INDEX `idx_custom_rules_user_id` ON `custom_rules` (`user_id`);--> statement-breakpoint
CREATE TABLE `custom_rules_reference_sections` (
	`custom_rule_id` text NOT NULL,
	`reference_slug` text NOT NULL,
	PRIMARY KEY(`custom_rule_id`, `reference_slug`),
	FOREIGN KEY (`custom_rule_id`) REFERENCES `custom_rules`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_custom_rules_reference_sections_rule` ON `custom_rules_reference_sections` (`custom_rule_id`);
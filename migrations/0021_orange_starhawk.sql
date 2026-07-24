CREATE TABLE `relations` (
	`from_type` text NOT NULL,
	`from_id` text NOT NULL,
	`to_type` text NOT NULL,
	`to_id` text NOT NULL,
	`relation` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`from_type`, `from_id`, `to_type`, `to_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_relations_from` ON `relations` (`from_type`,`from_id`);--> statement-breakpoint
CREATE INDEX `idx_relations_to` ON `relations` (`to_type`,`to_id`);--> statement-breakpoint
DROP TABLE `custom_rules_reference_sections`;
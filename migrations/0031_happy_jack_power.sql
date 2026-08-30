CREATE TABLE `user_feature_flags` (
	`user_id` text NOT NULL,
	`feature` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`user_id`, `feature`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);

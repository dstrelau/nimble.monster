CREATE TABLE `custom_rules_collections` (
	`custom_rule_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`custom_rule_id`, `collection_id`),
	FOREIGN KEY (`custom_rule_id`) REFERENCES `custom_rules`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);

CREATE TABLE `random_tables_collections` (
	`random_table_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`random_table_id`, `collection_id`),
	FOREIGN KEY (`random_table_id`) REFERENCES `random_tables`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);

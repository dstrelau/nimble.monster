CREATE TABLE `classes_collections` (
	`class_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`class_id`, `collection_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);

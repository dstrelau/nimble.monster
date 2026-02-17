CREATE TABLE `companions_collections` (
	`companion_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`companion_id`, `collection_id`),
	FOREIGN KEY (`companion_id`) REFERENCES `companions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ancestries_collections` (
	`ancestry_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`ancestry_id`, `collection_id`),
	FOREIGN KEY (`ancestry_id`) REFERENCES `ancestries`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `backgrounds_collections` (
	`background_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`background_id`, `collection_id`),
	FOREIGN KEY (`background_id`) REFERENCES `backgrounds`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subclasses_collections` (
	`subclass_id` text NOT NULL,
	`collection_id` text NOT NULL,
	PRIMARY KEY(`subclass_id`, `collection_id`),
	FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE cascade ON DELETE cascade
);

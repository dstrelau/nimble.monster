CREATE TABLE `reference_entries` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `content` text NOT NULL,
  `source_file` text NOT NULL,
  `order_index` integer NOT NULL DEFAULT 0,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reference_entries_slug_unique` ON `reference_entries` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_reference_entries_category` ON `reference_entries` (`category`);
--> statement-breakpoint
CREATE VIRTUAL TABLE `reference_entries_fts` USING fts5(
  slug UNINDEXED,
  title,
  content,
  content=`reference_entries`,
  content_rowid=`rowid`
);

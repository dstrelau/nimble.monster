ALTER TABLE `random_tables` ADD `source_id` text REFERENCES sources(id) ON DELETE SET NULL;

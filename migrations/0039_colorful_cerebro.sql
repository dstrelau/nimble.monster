ALTER TABLE `adventure_nodes` ADD `table_id` text REFERENCES random_tables(id) ON DELETE SET NULL ON UPDATE CASCADE;

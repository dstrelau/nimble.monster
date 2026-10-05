-- Match the catalog's existing parent-name and description search scope.
CREATE TRIGGER `global_search_random_tables_insert`
AFTER INSERT ON `random_tables`
WHEN new.`visibility` = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `summary`)
  VALUES ('randomTable', new.`id`, new.`user_id`, new.`visibility`, new.`source_id`, new.`name`, new.`description`);
END;--> statement-breakpoint
CREATE TRIGGER `global_search_random_tables_update`
AFTER UPDATE ON `random_tables`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'randomTable' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `summary`)
  SELECT 'randomTable', new.`id`, new.`user_id`, new.`visibility`, new.`source_id`, new.`name`, new.`description`
  WHERE new.`visibility` = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_random_tables_delete`
AFTER DELETE ON `random_tables`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'randomTable' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `summary`)
SELECT 'randomTable', `id`, `user_id`, `visibility`, `source_id`, `name`, `description`
FROM `random_tables` WHERE `visibility` = 'public';

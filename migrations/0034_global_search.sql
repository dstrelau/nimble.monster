-- Global search follows the migrations already deployed through 0033.
CREATE TABLE `global_search_catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`creator_id` text,
	`visibility` text NOT NULL,
	`source_id` text,
	`name` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`keywords` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_global_search_catalog_type_visibility` ON `global_search_catalog` (`entity_type`,`visibility`);--> statement-breakpoint
CREATE INDEX `idx_global_search_catalog_creator` ON `global_search_catalog` (`creator_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `global_search_catalog_entity_unique` ON `global_search_catalog` (`entity_type`,`entity_id`);--> statement-breakpoint

-- The catalog stores metadata and the FTS table stores only the weighted text
-- columns. Nested child rows (abilities, adventure nodes, and collection
-- members) are intentionally not trigger-maintained in this first slice;
-- their parent descriptions remain searchable without coupling this service to
-- every existing repository mutation path.
CREATE VIRTUAL TABLE `global_search_fts` USING fts5(
  `name`,
  `keywords`,
  `summary`,
  `body`,
  content=`global_search_catalog`,
  content_rowid=`id`
);--> statement-breakpoint
CREATE TRIGGER `global_search_catalog_fts_insert`
AFTER INSERT ON `global_search_catalog`
BEGIN
  INSERT INTO `global_search_fts` (`rowid`, `name`, `keywords`, `summary`, `body`)
  VALUES (new.`id`, new.`name`, new.`keywords`, new.`summary`, new.`body`);
END;--> statement-breakpoint
CREATE TRIGGER `global_search_catalog_fts_delete`
AFTER DELETE ON `global_search_catalog`
BEGIN
  INSERT INTO `global_search_fts` (`global_search_fts`, `rowid`, `name`, `keywords`, `summary`, `body`)
  VALUES ('delete', old.`id`, old.`name`, old.`keywords`, old.`summary`, old.`body`);
END;--> statement-breakpoint
CREATE TRIGGER `global_search_catalog_fts_update`
AFTER UPDATE ON `global_search_catalog`
BEGIN
  INSERT INTO `global_search_fts` (`global_search_fts`, `rowid`, `name`, `keywords`, `summary`, `body`)
  VALUES ('delete', old.`id`, old.`name`, old.`keywords`, old.`summary`, old.`body`);
  INSERT INTO `global_search_fts` (`rowid`, `name`, `keywords`, `summary`, `body`)
  VALUES (new.`id`, new.`name`, new.`keywords`, new.`summary`, new.`body`);
END;--> statement-breakpoint

-- Direct entity synchronization. Visibility is checked at the trigger
-- boundary, so private and secret records never enter the public catalog.
CREATE TRIGGER `global_search_monsters_insert`
AFTER INSERT ON `monsters`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES (
    CASE WHEN COALESCE(new.`hazard`, 0) = 1 THEN 'hazard' ELSE 'monster' END,
    new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`role`, ''),
    COALESCE(new.`kind`, '') || ' ' || COALESCE(new.`level`, '') || ' ' || COALESCE(new.`size`, '') || ' ' || COALESCE(new.`role`, ''),
    COALESCE(new.`peaceful`, '') || ' ' || COALESCE(new.`deadly`, '') || ' ' || COALESCE(new.`action_preface`, ''),
    COALESCE(new.`more_info`, '') || ' ' || COALESCE(new.`actions`, '') || ' ' || COALESCE(new.`abilities`, '') || ' ' || COALESCE(new.`bloodied`, '') || ' ' || COALESCE(new.`last_stand`, '') || ' ' || COALESCE(new.`saves`, '')
  );
END;--> statement-breakpoint
CREATE TRIGGER `global_search_monsters_update`
AFTER UPDATE ON `monsters`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_id` = old.`id` AND `entity_type` IN ('monster', 'hazard');
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT
    CASE WHEN COALESCE(new.`hazard`, 0) = 1 THEN 'hazard' ELSE 'monster' END,
    new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`role`, ''),
    COALESCE(new.`kind`, '') || ' ' || COALESCE(new.`level`, '') || ' ' || COALESCE(new.`size`, '') || ' ' || COALESCE(new.`role`, ''),
    COALESCE(new.`peaceful`, '') || ' ' || COALESCE(new.`deadly`, '') || ' ' || COALESCE(new.`action_preface`, ''),
    COALESCE(new.`more_info`, '') || ' ' || COALESCE(new.`actions`, '') || ' ' || COALESCE(new.`abilities`, '') || ' ' || COALESCE(new.`bloodied`, '') || ' ' || COALESCE(new.`last_stand`, '') || ' ' || COALESCE(new.`saves`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_monsters_delete`
AFTER DELETE ON `monsters`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_id` = old.`id` AND `entity_type` IN ('monster', 'hazard');
END;--> statement-breakpoint

CREATE TRIGGER `global_search_items_insert`
AFTER INSERT ON `items`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('item', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`kind`, ''), COALESCE(new.`kind`, '') || ' ' || COALESCE(new.`rarity`, ''), COALESCE(new.`description`, ''), COALESCE(new.`more_info`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `global_search_items_update`
AFTER UPDATE ON `items`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'item' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'item', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`kind`, ''), COALESCE(new.`kind`, '') || ' ' || COALESCE(new.`rarity`, ''), COALESCE(new.`description`, ''), COALESCE(new.`more_info`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_items_delete`
AFTER DELETE ON `items`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'item' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_companions_insert`
AFTER INSERT ON `companions`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('companion', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`class`, ''), COALESCE(new.`kind`, '') || ' ' || COALESCE(new.`class`, '') || ' ' || COALESCE(new.`size`, ''), COALESCE(new.`action_preface`, ''), COALESCE(new.`more_info`, '') || ' ' || COALESCE(new.`actions`, '') || ' ' || COALESCE(new.`abilities`, '') || ' ' || COALESCE(new.`saves`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `global_search_companions_update`
AFTER UPDATE ON `companions`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'companion' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'companion', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`class`, ''), COALESCE(new.`kind`, '') || ' ' || COALESCE(new.`class`, '') || ' ' || COALESCE(new.`size`, ''), COALESCE(new.`action_preface`, ''), COALESCE(new.`more_info`, '') || ' ' || COALESCE(new.`actions`, '') || ' ' || COALESCE(new.`abilities`, '') || ' ' || COALESCE(new.`saves`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_companions_delete`
AFTER DELETE ON `companions`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'companion' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_families_insert`
AFTER INSERT ON `families`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('family', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), NULL, new.`name`, '', '', COALESCE(new.`description`, ''), COALESCE(new.`abilities`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `global_search_families_update`
AFTER UPDATE ON `families`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'family' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'family', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), NULL, new.`name`, '', '', COALESCE(new.`description`, ''), COALESCE(new.`abilities`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_families_delete`
AFTER DELETE ON `families`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'family' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_subclasses_insert`
AFTER INSERT ON `subclasses`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('subclass', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`name_preface`, ''), COALESCE(new.`class_name`, '') || ' ' || COALESCE(new.`tagline`, ''), COALESCE(new.`description`, ''), '');
END;--> statement-breakpoint
CREATE TRIGGER `global_search_subclasses_update`
AFTER UPDATE ON `subclasses`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'subclass' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'subclass', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`name_preface`, ''), COALESCE(new.`class_name`, '') || ' ' || COALESCE(new.`tagline`, ''), COALESCE(new.`description`, ''), ''
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_subclasses_delete`
AFTER DELETE ON `subclasses`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'subclass' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_spell_schools_insert`
AFTER INSERT ON `spell_schools`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('spellSchool', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', '', COALESCE(new.`description`, ''), '');
END;--> statement-breakpoint
CREATE TRIGGER `global_search_spell_schools_update`
AFTER UPDATE ON `spell_schools`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'spellSchool' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'spellSchool', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', '', COALESCE(new.`description`, ''), ''
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_spell_schools_delete`
AFTER DELETE ON `spell_schools`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'spellSchool' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_backgrounds_insert`
AFTER INSERT ON `backgrounds`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('background', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', COALESCE(new.`requirement`, ''), COALESCE(new.`description`, ''), '');
END;--> statement-breakpoint
CREATE TRIGGER `global_search_backgrounds_update`
AFTER UPDATE ON `backgrounds`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'background' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'background', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', COALESCE(new.`requirement`, ''), COALESCE(new.`description`, ''), ''
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_backgrounds_delete`
AFTER DELETE ON `backgrounds`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'background' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_ancestries_insert`
AFTER INSERT ON `ancestries`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('ancestry', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', COALESCE(new.`size`, '') || ' ' || COALESCE(new.`rarity`, ''), COALESCE(new.`description`, ''), COALESCE(new.`abilities`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `global_search_ancestries_update`
AFTER UPDATE ON `ancestries`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'ancestry' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'ancestry', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', COALESCE(new.`size`, '') || ' ' || COALESCE(new.`rarity`, ''), COALESCE(new.`description`, ''), COALESCE(new.`abilities`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_ancestries_delete`
AFTER DELETE ON `ancestries`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'ancestry' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_classes_insert`
AFTER INSERT ON `classes`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('class', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', COALESCE(new.`key_stats`, '') || ' ' || COALESCE(new.`hit_die`, '') || ' ' || COALESCE(new.`armor`, '') || ' ' || COALESCE(new.`weapons`, '') || ' ' || COALESCE(new.`starting_gear`, ''), COALESCE(new.`description`, ''), COALESCE(new.`saves`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `global_search_classes_update`
AFTER UPDATE ON `classes`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'class' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'class', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, '', COALESCE(new.`key_stats`, '') || ' ' || COALESCE(new.`hit_die`, '') || ' ' || COALESCE(new.`armor`, '') || ' ' || COALESCE(new.`weapons`, '') || ' ' || COALESCE(new.`starting_gear`, ''), COALESCE(new.`description`, ''), COALESCE(new.`saves`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_classes_delete`
AFTER DELETE ON `classes`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'class' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_collections_insert`
AFTER INSERT ON `collections`
WHEN COALESCE(new.`visibility`, CASE WHEN COALESCE(new.`public`, 0) = 1 THEN 'public' ELSE 'private' END) = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('collection', new.`id`, new.`user_id`, COALESCE(new.`visibility`, CASE WHEN COALESCE(new.`public`, 0) = 1 THEN 'public' ELSE 'private' END), NULL, new.`name`, '', '', COALESCE(new.`description`, ''), '');
END;--> statement-breakpoint
CREATE TRIGGER `global_search_collections_update`
AFTER UPDATE ON `collections`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'collection' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'collection', new.`id`, new.`user_id`, COALESCE(new.`visibility`, CASE WHEN COALESCE(new.`public`, 0) = 1 THEN 'public' ELSE 'private' END), NULL, new.`name`, '', '', COALESCE(new.`description`, ''), ''
  WHERE COALESCE(new.`visibility`, CASE WHEN COALESCE(new.`public`, 0) = 1 THEN 'public' ELSE 'private' END) = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_collections_delete`
AFTER DELETE ON `collections`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'collection' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_encounters_insert`
AFTER INSERT ON `encounters`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('encounter', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), NULL, new.`name`, '', COALESCE(new.`hero_count`, '') || ' heroes level ' || COALESCE(new.`hero_level`, ''), COALESCE(new.`description`, ''), '');
END;--> statement-breakpoint
CREATE TRIGGER `global_search_encounters_update`
AFTER UPDATE ON `encounters`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'encounter' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'encounter', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), NULL, new.`name`, '', COALESCE(new.`hero_count`, '') || ' heroes level ' || COALESCE(new.`hero_level`, ''), COALESCE(new.`description`, ''), ''
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_encounters_delete`
AFTER DELETE ON `encounters`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'encounter' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_adventures_insert`
AFTER INSERT ON `adventures`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('adventure', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`tagline`, ''), '', COALESCE(new.`summary`, ''), '');
END;--> statement-breakpoint
CREATE TRIGGER `global_search_adventures_update`
AFTER UPDATE ON `adventures`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'adventure' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'adventure', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), new.`source_id`, new.`name`, COALESCE(new.`tagline`, ''), '', COALESCE(new.`summary`, ''), ''
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_adventures_delete`
AFTER DELETE ON `adventures`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'adventure' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `global_search_custom_rules_insert`
AFTER INSERT ON `custom_rules`
WHEN COALESCE(new.`visibility`, 'public') = 'public'
BEGIN
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  VALUES ('rule', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), NULL, new.`name`, 'Custom rule', COALESCE(new.`keywords`, ''), '', COALESCE(new.`content`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `global_search_custom_rules_update`
AFTER UPDATE ON `custom_rules`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'rule' AND `entity_id` = old.`id`;
  INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
  SELECT 'rule', new.`id`, new.`user_id`, COALESCE(new.`visibility`, 'public'), NULL, new.`name`, 'Custom rule', COALESCE(new.`keywords`, ''), '', COALESCE(new.`content`, '')
  WHERE COALESCE(new.`visibility`, 'public') = 'public';
END;--> statement-breakpoint
CREATE TRIGGER `global_search_custom_rules_delete`
AFTER DELETE ON `custom_rules`
BEGIN
  DELETE FROM `global_search_catalog` WHERE `entity_type` = 'rule' AND `entity_id` = old.`id`;
END;--> statement-breakpoint

-- Backfill public records that already existed before the catalog was added.
INSERT INTO `global_search_catalog` (`entity_type`, `entity_id`, `creator_id`, `visibility`, `source_id`, `name`, `subtitle`, `keywords`, `summary`, `body`)
SELECT CASE WHEN COALESCE(`hazard`, 0) = 1 THEN 'hazard' ELSE 'monster' END, `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, COALESCE(`role`, ''), COALESCE(`kind`, '') || ' ' || COALESCE(`level`, '') || ' ' || COALESCE(`size`, '') || ' ' || COALESCE(`role`, ''), COALESCE(`peaceful`, '') || ' ' || COALESCE(`deadly`, '') || ' ' || COALESCE(`action_preface`, ''), COALESCE(`more_info`, '') || ' ' || COALESCE(`actions`, '') || ' ' || COALESCE(`abilities`, '') || ' ' || COALESCE(`bloodied`, '') || ' ' || COALESCE(`last_stand`, '') || ' ' || COALESCE(`saves`, '') FROM `monsters` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'item', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, COALESCE(`kind`, ''), COALESCE(`kind`, '') || ' ' || COALESCE(`rarity`, ''), COALESCE(`description`, ''), COALESCE(`more_info`, '') FROM `items` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'companion', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, COALESCE(`class`, ''), COALESCE(`kind`, '') || ' ' || COALESCE(`class`, '') || ' ' || COALESCE(`size`, ''), COALESCE(`action_preface`, ''), COALESCE(`more_info`, '') || ' ' || COALESCE(`actions`, '') || ' ' || COALESCE(`abilities`, '') || ' ' || COALESCE(`saves`, '') FROM `companions` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'family', `id`, `user_id`, COALESCE(`visibility`, 'public'), NULL, `name`, '', '', COALESCE(`description`, ''), COALESCE(`abilities`, '') FROM `families` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'subclass', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, COALESCE(`name_preface`, ''), COALESCE(`class_name`, '') || ' ' || COALESCE(`tagline`, ''), COALESCE(`description`, ''), '' FROM `subclasses` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'spellSchool', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, '', '', COALESCE(`description`, ''), '' FROM `spell_schools` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'background', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, '', COALESCE(`requirement`, ''), COALESCE(`description`, ''), '' FROM `backgrounds` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'ancestry', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, '', COALESCE(`size`, '') || ' ' || COALESCE(`rarity`, ''), COALESCE(`description`, ''), COALESCE(`abilities`, '') FROM `ancestries` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'class', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, '', COALESCE(`key_stats`, '') || ' ' || COALESCE(`hit_die`, '') || ' ' || COALESCE(`armor`, '') || ' ' || COALESCE(`weapons`, '') || ' ' || COALESCE(`starting_gear`, ''), COALESCE(`description`, ''), COALESCE(`saves`, '') FROM `classes` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'collection', `id`, `user_id`, COALESCE(`visibility`, CASE WHEN COALESCE(`public`, 0) = 1 THEN 'public' ELSE 'private' END), NULL, `name`, '', '', COALESCE(`description`, ''), '' FROM `collections` WHERE COALESCE(`visibility`, CASE WHEN COALESCE(`public`, 0) = 1 THEN 'public' ELSE 'private' END) = 'public'
UNION ALL SELECT 'encounter', `id`, `user_id`, COALESCE(`visibility`, 'public'), NULL, `name`, '', COALESCE(`hero_count`, '') || ' heroes level ' || COALESCE(`hero_level`, ''), COALESCE(`description`, ''), '' FROM `encounters` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'adventure', `id`, `user_id`, COALESCE(`visibility`, 'public'), `source_id`, `name`, COALESCE(`tagline`, ''), '', COALESCE(`summary`, ''), '' FROM `adventures` WHERE COALESCE(`visibility`, 'public') = 'public'
UNION ALL SELECT 'rule', `id`, `user_id`, COALESCE(`visibility`, 'public'), NULL, `name`, 'Custom rule', COALESCE(`keywords`, ''), '', COALESCE(`content`, '') FROM `custom_rules` WHERE COALESCE(`visibility`, 'public') = 'public';

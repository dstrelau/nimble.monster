CREATE VIRTUAL TABLE `custom_rules_fts` USING fts5(
  `name`,
  `keywords`,
  content=`custom_rules`,
  content_rowid=`rowid`
);
--> statement-breakpoint
CREATE TRIGGER `custom_rules_fts_insert` AFTER INSERT ON `custom_rules` BEGIN
  INSERT INTO `custom_rules_fts` (`rowid`, `name`, `keywords`)
  VALUES (new.`rowid`, new.`name`, new.`keywords`);
END;
--> statement-breakpoint
CREATE TRIGGER `custom_rules_fts_delete` AFTER DELETE ON `custom_rules` BEGIN
  INSERT INTO `custom_rules_fts` (`custom_rules_fts`, `rowid`, `name`, `keywords`)
  VALUES ('delete', old.`rowid`, old.`name`, old.`keywords`);
END;
--> statement-breakpoint
CREATE TRIGGER `custom_rules_fts_update` AFTER UPDATE OF `name`, `keywords` ON `custom_rules` BEGIN
  INSERT INTO `custom_rules_fts` (`custom_rules_fts`, `rowid`, `name`, `keywords`)
  VALUES ('delete', old.`rowid`, old.`name`, old.`keywords`);
  INSERT INTO `custom_rules_fts` (`rowid`, `name`, `keywords`)
  VALUES (new.`rowid`, new.`name`, new.`keywords`);
END;
--> statement-breakpoint
INSERT INTO `custom_rules_fts` (`custom_rules_fts`) VALUES ('rebuild');

CREATE TYPE armor_type_new AS ENUM ('', 'medium', 'heavy');

ALTER TABLE monsters ALTER COLUMN armor DROP DEFAULT;

ALTER TABLE monsters
  ALTER COLUMN armor
  TYPE armor_type_new
  USING (
    CASE armor::text
      WHEN 'none' THEN ''::armor_type_new
      ELSE armor::text::armor_type_new
    END
  );

DROP TYPE armor_type;

ALTER TYPE armor_type_new RENAME TO armor_type;

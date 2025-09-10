-- AlterTable
ALTER TABLE "monsters" ADD COLUMN     "level_int" INTEGER NOT NULL DEFAULT 0;

-- Update level_int based on existing level values
UPDATE "monsters" SET "level_int" = CASE
    WHEN "level" = '1/4' THEN -4
    WHEN "level" = '1/3' THEN -3
    WHEN "level" = '1/2' THEN -2
    WHEN "level" ~ '^[0-9]+$' AND CAST("level" AS INTEGER) BETWEEN 1 AND 20 THEN CAST("level" AS INTEGER)
    ELSE 0
END;

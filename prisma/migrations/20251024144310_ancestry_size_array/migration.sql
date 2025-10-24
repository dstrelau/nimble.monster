-- AlterTable: Migrate size from scalar to array
-- Step 1: Add temporary column
ALTER TABLE "ancestries" ADD COLUMN "size_temp" "size_type"[];

-- Step 2: Migrate data - wrap existing size value in an array
UPDATE "ancestries" SET "size_temp" = ARRAY["size"]::size_type[];

-- Step 3: Drop old column
ALTER TABLE "ancestries" DROP COLUMN "size";

-- Step 4: Rename temp column to size
ALTER TABLE "ancestries" RENAME COLUMN "size_temp" TO "size";

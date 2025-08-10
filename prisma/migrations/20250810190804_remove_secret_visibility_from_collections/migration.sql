-- Update collections with visibility = 'secret' to 'private'
UPDATE "collections" SET "visibility" = 'private' WHERE "visibility" = 'secret';

-- Remove 'secret' from collection_visibility enum
-- First drop the default temporarily
ALTER TABLE "collections" ALTER COLUMN "visibility" DROP DEFAULT;

-- Rename old enum and create new one
ALTER TYPE "collection_visibility" RENAME TO "collection_visibility_old";
CREATE TYPE "collection_visibility" AS ENUM ('public', 'private');

-- Update the column type
ALTER TABLE "collections" ALTER COLUMN "visibility" TYPE "collection_visibility" USING "visibility"::text::"collection_visibility";

-- Restore the default value
ALTER TABLE "collections" ALTER COLUMN "visibility" SET DEFAULT 'public';

-- Drop the old enum
DROP TYPE "collection_visibility_old";
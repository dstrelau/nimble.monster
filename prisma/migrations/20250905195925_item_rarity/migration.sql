-- CreateEnum
CREATE TYPE "item_rarity" AS ENUM ('unspecified', 'common', 'uncommon', 'rare', 'very_rare', 'legendary');

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "rarity" "item_rarity" NOT NULL DEFAULT 'unspecified';

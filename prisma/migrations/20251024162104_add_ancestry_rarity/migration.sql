-- CreateEnum
CREATE TYPE "ancestry_rarity" AS ENUM ('common', 'exotic');

-- AlterTable
ALTER TABLE "ancestries" ADD COLUMN     "rarity" "ancestry_rarity" NOT NULL DEFAULT 'common';

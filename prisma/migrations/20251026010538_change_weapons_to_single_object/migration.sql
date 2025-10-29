/*
  Warnings:

  - Changed the type of `weapons` on the `classes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "classes" DROP COLUMN "weapons",
ADD COLUMN     "weapons" JSONB NOT NULL;

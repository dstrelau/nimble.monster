/*
  Warnings:

  - You are about to drop the column `family_id` on the `monsters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "monsters" DROP CONSTRAINT "monsters_family_id_fkey";

-- AlterTable
ALTER TABLE "monsters" DROP COLUMN "family_id";

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

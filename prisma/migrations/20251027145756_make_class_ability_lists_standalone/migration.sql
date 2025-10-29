/*
  Warnings:

  - You are about to drop the column `class_id` on the `class_ability_lists` table. All the data in the column will be lost.
  - You are about to drop the column `order_index` on the `class_ability_lists` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `class_ability_lists` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "class_ability_lists" DROP CONSTRAINT "class_ability_lists_class_id_fkey";

-- DropIndex
DROP INDEX "idx_class_ability_lists_class_order";

-- AlterTable
ALTER TABLE "class_ability_lists" DROP COLUMN "class_id",
DROP COLUMN "order_index",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "classes_class_ability_lists" (
    "class_id" UUID NOT NULL,
    "ability_list_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "classes_class_ability_lists_pkey" PRIMARY KEY ("class_id","ability_list_id")
);

-- CreateIndex
CREATE INDEX "idx_class_ability_list_links_class_order" ON "classes_class_ability_lists"("class_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_class_ability_lists_user_id" ON "class_ability_lists"("user_id");

-- AddForeignKey
ALTER TABLE "class_ability_lists" ADD CONSTRAINT "class_ability_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classes_class_ability_lists" ADD CONSTRAINT "classes_class_ability_lists_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes_class_ability_lists" ADD CONSTRAINT "classes_class_ability_lists_ability_list_id_fkey" FOREIGN KEY ("ability_list_id") REFERENCES "class_ability_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "image_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "idx_users_username" ON "users"("username");

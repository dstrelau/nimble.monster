-- AlterTable
ALTER TABLE "items" ADD COLUMN     "remixed_from_id" UUID;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_remixed_from_id_fkey" FOREIGN KEY ("remixed_from_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

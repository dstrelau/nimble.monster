-- AlterTable
ALTER TABLE "monsters" ADD COLUMN     "remixed_from_id" UUID;

-- AddForeignKey
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_remixed_from_id_fkey" FOREIGN KEY ("remixed_from_id") REFERENCES "monsters"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

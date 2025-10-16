-- AlterTable
ALTER TABLE "companions" ADD COLUMN     "source_id" UUID;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "source_id" UUID;

-- AlterTable
ALTER TABLE "monsters" ADD COLUMN     "source_id" UUID;

-- AlterTable
ALTER TABLE "spell_schools" ADD COLUMN     "source_id" UUID;

-- AlterTable
ALTER TABLE "subclasses" ADD COLUMN     "source_id" UUID;

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companions" ADD CONSTRAINT "companions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subclasses" ADD CONSTRAINT "subclasses_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "spell_schools" ADD CONSTRAINT "spell_schools_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

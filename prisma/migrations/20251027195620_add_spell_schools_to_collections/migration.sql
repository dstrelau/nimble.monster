-- CreateTable
CREATE TABLE "spell_schools_collections" (
    "collection_id" UUID NOT NULL,
    "spell_school_id" UUID NOT NULL,

    CONSTRAINT "spell_schools_collections_pkey" PRIMARY KEY ("spell_school_id","collection_id")
);

-- AddForeignKey
ALTER TABLE "spell_schools_collections" ADD CONSTRAINT "spell_schools_collections_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_schools_collections" ADD CONSTRAINT "spell_schools_collections_spell_school_id_fkey" FOREIGN KEY ("spell_school_id") REFERENCES "spell_schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

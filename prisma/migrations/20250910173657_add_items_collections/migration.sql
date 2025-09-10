-- CreateTable
CREATE TABLE "items_collections" (
    "collection_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,

    CONSTRAINT "items_collections_pkey" PRIMARY KEY ("item_id","collection_id")
);

-- AddForeignKey
ALTER TABLE "items_collections" ADD CONSTRAINT "items_collections_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_collections" ADD CONSTRAINT "items_collections_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

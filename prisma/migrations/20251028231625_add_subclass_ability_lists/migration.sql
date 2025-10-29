-- CreateTable
CREATE TABLE "subclasses_class_ability_lists" (
    "subclass_id" UUID NOT NULL,
    "ability_list_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "subclasses_class_ability_lists_pkey" PRIMARY KEY ("subclass_id","ability_list_id")
);

-- CreateIndex
CREATE INDEX "idx_subclass_ability_list_links_subclass_order" ON "subclasses_class_ability_lists"("subclass_id", "order_index");

-- AddForeignKey
ALTER TABLE "subclasses_class_ability_lists" ADD CONSTRAINT "subclasses_class_ability_lists_subclass_id_fkey" FOREIGN KEY ("subclass_id") REFERENCES "subclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclasses_class_ability_lists" ADD CONSTRAINT "subclasses_class_ability_lists_ability_list_id_fkey" FOREIGN KEY ("ability_list_id") REFERENCES "class_ability_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

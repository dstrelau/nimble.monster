-- CreateEnum
CREATE TYPE "class_visibility" AS ENUM ('public', 'private');

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keyStats" TEXT[],
    "hit_die" TEXT NOT NULL,
    "starting_hp" INTEGER NOT NULL,
    "saves" JSONB NOT NULL,
    "armor" TEXT[],
    "weapons" JSONB[],
    "starting_gear" TEXT[],
    "visibility" "class_visibility" NOT NULL DEFAULT 'public',
    "user_id" UUID NOT NULL,
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_abilities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "class_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "class_abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_ability_lists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "class_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "class_ability_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_ability_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "class_ability_list_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "class_ability_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes_awards" (
    "class_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "classes_awards_pkey" PRIMARY KEY ("class_id","award_id")
);

-- CreateIndex
CREATE INDEX "idx_classes_user_id" ON "classes"("user_id");

-- CreateIndex
CREATE INDEX "idx_class_abilities_class_level_order" ON "class_abilities"("class_id", "level", "order_index");

-- CreateIndex
CREATE INDEX "idx_class_ability_lists_class_order" ON "class_ability_lists"("class_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_class_ability_items_list_order" ON "class_ability_items"("class_ability_list_id", "order_index");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "class_abilities" ADD CONSTRAINT "class_abilities_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_ability_lists" ADD CONSTRAINT "class_ability_lists_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_ability_items" ADD CONSTRAINT "class_ability_items_class_ability_list_id_fkey" FOREIGN KEY ("class_ability_list_id") REFERENCES "class_ability_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes_awards" ADD CONSTRAINT "classes_awards_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes_awards" ADD CONSTRAINT "classes_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

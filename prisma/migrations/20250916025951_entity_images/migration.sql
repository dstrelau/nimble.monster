-- CreateEnum
CREATE TYPE "entity_image_type" AS ENUM ('monster', 'companion', 'item');

-- CreateEnum
CREATE TYPE "generation_status" AS ENUM ('generating', 'completed', 'failed');

-- CreateTable
CREATE TABLE "entity_images" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "entity_type" "entity_image_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "blob_url" TEXT,
    "generated_at" TIMESTAMPTZ(6),
    "entity_version" TEXT NOT NULL,
    "generation_status" "generation_status" NOT NULL DEFAULT 'generating',
    "generation_started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_entity_images_status_started" ON "entity_images"("generation_status", "generation_started_at");

-- CreateIndex
CREATE UNIQUE INDEX "entity_images_entity_type_entity_id_key" ON "entity_images"("entity_type", "entity_id");

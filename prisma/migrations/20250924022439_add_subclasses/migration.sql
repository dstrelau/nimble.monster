-- CreateEnum
CREATE TYPE "subclass_visibility" AS ENUM ('public', 'private');

-- CreateTable
CREATE TABLE "subclasses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,
    "name_preface" TEXT,
    "description" TEXT,
    "visibility" "subclass_visibility" NOT NULL DEFAULT 'public',
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subclasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subclass_abilities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subclass_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "subclass_abilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_subclasses_user_id" ON "subclasses"("user_id");

-- CreateIndex
CREATE INDEX "idx_subclass_abilities_subclass_level_order" ON "subclass_abilities"("subclass_id", "level", "order_index");

-- AddForeignKey
ALTER TABLE "subclasses" ADD CONSTRAINT "subclasses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subclass_abilities" ADD CONSTRAINT "subclass_abilities_subclass_id_fkey" FOREIGN KEY ("subclass_id") REFERENCES "subclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

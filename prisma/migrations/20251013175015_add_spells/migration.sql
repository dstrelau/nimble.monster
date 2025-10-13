-- CreateEnum
CREATE TYPE "spell_school_visibility" AS ENUM ('public', 'private');

-- CreateTable
CREATE TABLE "spell_schools" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "spell_school_visibility" NOT NULL DEFAULT 'public',
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spell_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spells" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 0,
    "actions" INTEGER NOT NULL DEFAULT 1,
    "reaction" BOOLEAN NOT NULL DEFAULT false,
    "target_type" TEXT,
    "target_kind" TEXT,
    "target_distance" INTEGER,
    "damage" TEXT,
    "description" TEXT NOT NULL,
    "high_levels" TEXT,
    "concentration" TEXT,
    "upcast" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_spell_schools_user_id" ON "spell_schools"("user_id");

-- CreateIndex
CREATE INDEX "idx_spells_school_id" ON "spells"("school_id");

-- AddForeignKey
ALTER TABLE "spell_schools" ADD CONSTRAINT "spell_schools_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "spells" ADD CONSTRAINT "spells_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "spell_schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

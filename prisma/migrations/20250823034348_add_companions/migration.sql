-- CreateEnum
CREATE TYPE "companion_visibility" AS ENUM ('public', 'private');

-- CreateTable
CREATE TABLE "companions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT '',
    "class" TEXT NOT NULL DEFAULT '',
    "hp_per_level" TEXT NOT NULL,
    "wounds" INTEGER NOT NULL DEFAULT 0,
    "size" "size_type" NOT NULL DEFAULT 'medium',
    "saves" TEXT NOT NULL DEFAULT '',
    "actions" JSONB[],
    "abilities" JSONB[],
    "action_preface" TEXT,
    "dying_rule" TEXT NOT NULL DEFAULT '',
    "more_info" TEXT DEFAULT '',
    "visibility" "companion_visibility" NOT NULL DEFAULT 'public',
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_companions_user_id" ON "companions"("user_id");

-- AddForeignKey
ALTER TABLE "companions" ADD CONSTRAINT "companions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

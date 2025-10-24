-- CreateTable
CREATE TABLE "backgrounds" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirement" TEXT,
    "user_id" UUID NOT NULL,
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ancestries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "size" "size_type" NOT NULL DEFAULT 'medium',
    "abilities" JSONB[],
    "user_id" UUID NOT NULL,
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ancestries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backgrounds_awards" (
    "background_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "backgrounds_awards_pkey" PRIMARY KEY ("background_id","award_id")
);

-- CreateTable
CREATE TABLE "ancestries_awards" (
    "ancestry_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "ancestries_awards_pkey" PRIMARY KEY ("ancestry_id","award_id")
);

-- CreateIndex
CREATE INDEX "idx_backgrounds_user_id" ON "backgrounds"("user_id");

-- CreateIndex
CREATE INDEX "idx_ancestries_user_id" ON "ancestries"("user_id");

-- AddForeignKey
ALTER TABLE "backgrounds" ADD CONSTRAINT "backgrounds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "backgrounds" ADD CONSTRAINT "backgrounds_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ancestries" ADD CONSTRAINT "ancestries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ancestries" ADD CONSTRAINT "ancestries_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "backgrounds_awards" ADD CONSTRAINT "backgrounds_awards_background_id_fkey" FOREIGN KEY ("background_id") REFERENCES "backgrounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backgrounds_awards" ADD CONSTRAINT "backgrounds_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ancestries_awards" ADD CONSTRAINT "ancestries_awards_ancestry_id_fkey" FOREIGN KEY ("ancestry_id") REFERENCES "ancestries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ancestries_awards" ADD CONSTRAINT "ancestries_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

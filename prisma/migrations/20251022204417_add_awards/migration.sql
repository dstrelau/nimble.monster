-- CreateTable
CREATE TABLE "awards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monsters_awards" (
    "monster_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "monsters_awards_pkey" PRIMARY KEY ("monster_id","award_id")
);

-- CreateTable
CREATE TABLE "items_awards" (
    "item_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "items_awards_pkey" PRIMARY KEY ("item_id","award_id")
);

-- CreateTable
CREATE TABLE "companions_awards" (
    "companion_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "companions_awards_pkey" PRIMARY KEY ("companion_id","award_id")
);

-- CreateTable
CREATE TABLE "subclasses_awards" (
    "subclass_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "subclasses_awards_pkey" PRIMARY KEY ("subclass_id","award_id")
);

-- CreateTable
CREATE TABLE "spell_schools_awards" (
    "school_id" UUID NOT NULL,
    "award_id" UUID NOT NULL,

    CONSTRAINT "spell_schools_awards_pkey" PRIMARY KEY ("school_id","award_id")
);

-- AddForeignKey
ALTER TABLE "monsters_awards" ADD CONSTRAINT "monsters_awards_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monsters_awards" ADD CONSTRAINT "monsters_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_awards" ADD CONSTRAINT "items_awards_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_awards" ADD CONSTRAINT "items_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companions_awards" ADD CONSTRAINT "companions_awards_companion_id_fkey" FOREIGN KEY ("companion_id") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companions_awards" ADD CONSTRAINT "companions_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclasses_awards" ADD CONSTRAINT "subclasses_awards_subclass_id_fkey" FOREIGN KEY ("subclass_id") REFERENCES "subclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclasses_awards" ADD CONSTRAINT "subclasses_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_schools_awards" ADD CONSTRAINT "spell_schools_awards_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "spell_schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_schools_awards" ADD CONSTRAINT "spell_schools_awards_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

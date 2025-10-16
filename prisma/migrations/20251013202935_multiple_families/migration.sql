-- CreateTable
CREATE TABLE "monsters_families" (
    "monster_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,

    CONSTRAINT "monsters_families_pkey" PRIMARY KEY ("monster_id","family_id")
);

-- Migrate existing family_id data to join table
INSERT INTO "monsters_families" ("monster_id", "family_id")
SELECT "id", "family_id"
FROM "monsters"
WHERE "family_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "monsters_families" ADD CONSTRAINT "monsters_families_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monsters_families" ADD CONSTRAINT "monsters_families_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

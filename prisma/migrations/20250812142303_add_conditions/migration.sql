-- CreateTable
CREATE TABLE "public"."conditions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monsterId" UUID,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monsters_conditions" (
    "monster_id" UUID NOT NULL,
    "condition_id" UUID NOT NULL,
    "inline" BOOLEAN NOT NULL,

    CONSTRAINT "monsters_conditions_pkey" PRIMARY KEY ("monster_id","condition_id")
);

-- AddForeignKey
ALTER TABLE "public"."conditions" ADD CONSTRAINT "conditions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."conditions" ADD CONSTRAINT "conditions_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "public"."monsters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monsters_conditions" ADD CONSTRAINT "monsters_conditions_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "public"."monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monsters_conditions" ADD CONSTRAINT "monsters_conditions_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

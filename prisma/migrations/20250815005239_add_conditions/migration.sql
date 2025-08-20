-- CreateTable
CREATE TABLE "public"."conditions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "official" BOOLEAN NOT NULL DEFAULT false,
    "creator_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
ALTER TABLE "public"."conditions" ADD CONSTRAINT "conditions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."monsters_conditions" ADD CONSTRAINT "monsters_conditions_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "public"."monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monsters_conditions" ADD CONSTRAINT "monsters_conditions_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

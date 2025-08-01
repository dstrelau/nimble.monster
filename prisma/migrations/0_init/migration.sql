-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "armor_type" AS ENUM ('', 'medium', 'heavy');

-- CreateEnum
CREATE TYPE "collection_visibility" AS ENUM ('public', 'secret', 'private');

-- CreateEnum
CREATE TYPE "family_visibility" AS ENUM ('public', 'secret', 'private');

-- CreateEnum
CREATE TYPE "monster_visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "size_type" AS ENUM ('tiny', 'small', 'medium', 'large', 'huge', 'gargantuan');

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL DEFAULT '',
    "visibility" "collection_visibility" NOT NULL DEFAULT 'public',

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monsters_collections" (
    "collection_id" UUID NOT NULL,
    "monster_id" UUID NOT NULL,

    CONSTRAINT "monsters_collections_pkey" PRIMARY KEY ("monster_id","collection_id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "visibility" "family_visibility" NOT NULL DEFAULT 'public',
    "name" TEXT NOT NULL,
    "abilities" JSONB[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monsters" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "armor" "armor_type" NOT NULL,
    "size" "size_type" NOT NULL DEFAULT 'medium',
    "speed" INTEGER NOT NULL DEFAULT 0,
    "fly" INTEGER NOT NULL DEFAULT 0,
    "swim" INTEGER NOT NULL DEFAULT 0,
    "actions" JSONB[],
    "abilities" JSONB[],
    "legendary" BOOLEAN NOT NULL DEFAULT false,
    "bloodied" TEXT NOT NULL DEFAULT '',
    "last_stand" TEXT NOT NULL DEFAULT '',
    "saves" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL DEFAULT '',
    "visibility" "monster_visibility" NOT NULL DEFAULT 'public',
    "family_id" UUID,
    "action_preface" TEXT,
    "more_info" TEXT DEFAULT '',
    "user_id" UUID NOT NULL,

    CONSTRAINT "monsters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discord_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discord_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_collections_user_id" ON "collections"("user_id");

-- CreateIndex
CREATE INDEX "idx_monsters_user_id" ON "monsters"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expires_at" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idx_users_discord_id" ON "users"("discord_id");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monsters_collections" ADD CONSTRAINT "monsters_collections_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monsters_collections" ADD CONSTRAINT "monsters_collections_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;


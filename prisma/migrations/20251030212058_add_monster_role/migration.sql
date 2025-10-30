-- CreateEnum
CREATE TYPE "monster_role" AS ENUM ('melee', 'ranged', 'controller', 'support', 'aoe', 'summoner', 'striker', 'ambusher', 'defender');

-- AlterTable
ALTER TABLE "monsters" ADD COLUMN     "role" "monster_role";

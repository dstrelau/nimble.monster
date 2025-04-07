import { Prisma, PrismaClient } from "@/lib/prisma";
import { Monster as PrismaMonster } from "@/lib/prisma";
import {
  Ability,
  Action,
  Collection,
  CollectionOverview,
  Monster,
} from "@/lib/types";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const toMonster = (m: PrismaMonster): Monster => ({
  ...m,
  saves: m.saves.join(" "),
  armor: m.armor === "EMPTY_ENUM_VALUE" ? "" : m.armor,
  abilities: m.abilities as unknown as Ability[],
  actions: m.actions as unknown as Action[],
  actionPreface: m.actionPreface || "",
  moreInfo: m.moreInfo || "",
});

export const listPublicMonsters = async (): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export const toCollectionOverview = (
  c: Prisma.Result<
    typeof prisma.collection,
    {
      include: {
        creator: true;
        monsterCollections: { include: { monster: true } };
      };
    },
    "findMany"
  >[0],
): CollectionOverview => {
  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary,
  ).length;
  return {
    ...c,
    legendaryCount,
    standardCount: c.monsterCollections.length - legendaryCount,
    creator: { ...c.creator, avatar: c.creator.avatar || "" },
  };
};

export const listCollectionsForUser = async (
  userId: string,
): Promise<CollectionOverview[]> => {
  return (
    await prisma.collection.findMany({
      where: { creator: { discordId: userId } },
      include: {
        creator: true,
        monsterCollections: { include: { monster: true } },
      },
    })
  ).map(toCollectionOverview);
};

export const listPublicCollections = async (): Promise<
  CollectionOverview[]
> => {
  return (
    await prisma.collection.findMany({
      where: { visibility: "public" },
      include: {
        creator: true,
        monsterCollections: { include: { monster: true } },
      },
    })
  ).map(toCollectionOverview);
};

export const getCollection = async (id: string): Promise<Collection | null> => {
  const c = await prisma.collection.findUnique({
    where: { id: id },
    include: {
      creator: true,
      monsterCollections: { include: { monster: true } },
    },
  });
  if (!c) return c;

  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary,
  ).length;
  return {
    ...c,
    legendaryCount: legendaryCount,
    standardCount: c.monsterCollections.length - legendaryCount,
    creator: { ...c.creator, avatar: c.creator.avatar || "" },
    monsters: c.monsterCollections.flatMap((mc) => toMonster(mc.monster)),
  };
};

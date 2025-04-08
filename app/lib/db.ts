import { Prisma, PrismaClient } from "@/lib/prisma";

import {
  Ability,
  Action,
  Collection,
  CollectionOverview,
  Family,
  Monster,
} from "@/lib/types";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const toMonster = (
  m: Prisma.Result<
    typeof prisma.monster,
    {
      include: {
        family: true;
      };
    },
    "findMany"
  >[0],
): Monster => ({
  ...m,
  saves: m.saves.join(" "),
  armor: m.armor === "EMPTY_ENUM_VALUE" ? "" : m.armor,
  abilities: m.abilities as unknown as Ability[],
  actions: m.actions as unknown as Action[],
  actionPreface: m.actionPreface || "",
  moreInfo: m.moreInfo || "",
  family: toFamily(m.family),
});

export const toFamily = (
  f: Prisma.Result<typeof prisma.family, object, "findMany">[0] | null,
): Family | undefined => {
  if (!f) {
    return undefined;
  }
  return {
    ...f,
    abilities: f.abilities as unknown as Ability[],
  };
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

export const listPublicMonsters = async (): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: { family: true },
    })
  ).map(toMonster);
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
      monsterCollections: {
        include: { monster: { include: { family: true } } },
      },
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

import { Collection, CollectionOverview } from "@/lib/types";
import { prisma } from "./index";
import { toCollectionOverview, toMonster } from "./converters";

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
        include: { monster: { include: { family: true, creator: true } } },
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
    monsters: c.monsterCollections
      .flatMap((mc) => toMonster(mc.monster))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

export const getUserPublicCollections = async (
  username: string,
): Promise<CollectionOverview[]> => {
  return (
    await prisma.collection.findMany({
      where: {
        creator: { username },
        visibility: "public",
      },
      include: {
        creator: true,
        monsterCollections: { include: { monster: true } },
      },
    })
  ).map(toCollectionOverview);
};

export const getUserPublicCollectionsCount = async (
  username: string,
): Promise<number> => {
  return await prisma.collection.count({
    where: {
      creator: { username },
      visibility: "public",
    },
  });
};

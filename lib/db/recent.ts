import type { Family, User } from "@/lib/types";
import {
  toCollectionOverview,
  toCompanion,
  toFamilyOverview,
  toItem,
  toMonster,
} from "./converters";
import { prisma } from "./index";

export type RecentContentItem =
  | {
      type: "monster";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toMonster>;
    }
  | {
      type: "item";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toItem>;
    }
  | {
      type: "companion";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toCompanion>;
    }
  | {
      type: "collection";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toCollectionOverview>;
    }
  | {
      type: "family";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: Family;
    };

export const getRecentPublicContent = async (
  limit = 25
): Promise<RecentContentItem[]> => {
  const [monsters, items, companions, collections, families] =
    await Promise.all([
      prisma.monster.findMany({
        where: { visibility: "public" },
        include: {
          creator: true,
          family: { include: { creator: true } },
          monsterConditions: { include: { condition: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.item.findMany({
        where: { visibility: "public" },
        include: { creator: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.companion.findMany({
        where: { visibility: "public" },
        include: { creator: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.collection.findMany({
        where: { visibility: "public" },
        include: {
          creator: true,
          monsterCollections: {
            where: { monster: { visibility: "public" } },
            include: {
              monster: {
                include: {
                  creator: true,
                  family: { include: { creator: true } },
                },
              },
            },
          },
          itemCollections: {
            include: {
              item: {
                include: { creator: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.family.findMany({
        where: { visibility: "public" },
        include: {
          creator: true,
          monsters: {
            where: { visibility: "public" },
            include: {
              creator: true,
              family: { include: { creator: true } },
              monsterConditions: { include: { condition: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

  const allItems: RecentContentItem[] = [
    ...monsters.map((monster) => ({
      type: "monster" as const,
      id: monster.id,
      name: monster.name,
      createdAt: monster.createdAt,
      creator: { ...monster.creator, avatar: monster.creator.avatar || "" },
      data: toMonster(monster),
    })),
    ...items.map((item) => ({
      type: "item" as const,
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      creator: { ...item.creator, avatar: item.creator.avatar || "" },
      data: toItem(item),
    })),
    ...companions.map((companion) => ({
      type: "companion" as const,
      id: companion.id,
      name: companion.name,
      createdAt: companion.createdAt,
      creator: { ...companion.creator, avatar: companion.creator.avatar || "" },
      data: toCompanion(companion),
    })),
    ...collections
      .filter((collection) => collection.createdAt !== null)
      .map((collection) => ({
        type: "collection" as const,
        id: collection.id,
        name: collection.name,
        createdAt: collection.createdAt as Date,
        creator: {
          ...collection.creator,
          avatar: collection.creator.avatar || "",
        },
        data: toCollectionOverview(collection),
      })),
    ...families
      .filter(
        (family) => family.monsters.length > 0 && family.createdAt !== null
      )
      .map((family) => {
        const familyOverview = toFamilyOverview(family);
        if (!familyOverview) {
          throw new Error(`Failed to convert family ${family.id}`);
        }
        return {
          type: "family" as const,
          id: family.id,
          name: family.name,
          createdAt: family.createdAt as Date,
          creator: { ...family.creator, avatar: family.creator.avatar || "" },
          data: {
            ...familyOverview,
            monsters: family.monsters.map(toMonster),
          } as Family,
        };
      }),
  ];

  return allItems
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
};

import type { Collection, CollectionOverview } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toCollectionOverview, toMonster, toMonsterMini } from "./converters";
import { prisma } from "./index";

export const listCollectionsWithMonstersForUser = async (
  userId: string
): Promise<CollectionOverview[]> => {
  const collections = await prisma.collection.findMany({
    where: { creator: { discordId: userId } },
    include: {
      creator: true,
      monsterCollections: {
        include: {
          monster: true,
        },
      },
    },
  });

  return collections.map((c) => {
    const legendaryCount = c.monsterCollections.filter(
      (m) => m.monster.legendary
    ).length;
    return {
      ...c,
      createdAt: c.createdAt ?? undefined,
      legendaryCount,
      standardCount: c.monsterCollections.length - legendaryCount,
      creator: { ...c.creator, avatar: c.creator.avatar || "" },
      monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
    };
  });
};

export const listPublicCollections = async (): Promise<
  CollectionOverview[]
> => {
  return (
    await prisma.collection.findMany({
      where: { visibility: "public" },
      include: {
        creator: true,
        monsterCollections: {
          include: {
            monster: true,
          },
        },
      },
    })
  ).map(toCollectionOverview);
};

export const listPublicCollectionsHavingMonsters = async (): Promise<
  CollectionOverview[]
> => {
  const collections = await prisma.collection.findMany({
    where: { visibility: "public" },
    include: {
      creator: true,
      monsterCollections: {
        where: { monster: { visibility: "public" } },
        include: {
          monster: {},
        },
      },
    },
  });

  return collections
    .filter((c) => c.monsterCollections.length > 0)
    .map((c) => {
      const legendaryCount = c.monsterCollections.filter(
        (m) => m.monster.legendary
      ).length;
      return {
        ...c,
        createdAt: c.createdAt ?? undefined,
        legendaryCount,
        standardCount: c.monsterCollections.length - legendaryCount,
        creator: { ...c.creator, avatar: c.creator.avatar || "" },
        monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
      };
    });
};

export const getCollection = async (id: string): Promise<Collection | null> => {
  if (!isValidUUID(id)) return null;

  const c = await prisma.collection.findUnique({
    where: { id: id },
    include: {
      creator: true,
      monsterCollections: {
        include: {
          monster: {
            include: {
              family: { include: { creator: true } },
              creator: true,
            },
          },
        },
      },
    },
  });
  if (!c) return c;

  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary
  ).length;
  return {
    ...c,
    createdAt: c.createdAt ?? undefined,
    legendaryCount,
    standardCount: c.monsterCollections.length - legendaryCount,
    creator: { ...c.creator, avatar: c.creator.avatar || "" },
    monsters: c.monsterCollections
      .flatMap((mc) => toMonster(mc.monster))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

export const getUserPublicCollectionsHavingMonsters = async (
  username: string
): Promise<CollectionOverview[]> => {
  const collections = await prisma.collection.findMany({
    where: {
      creator: { username },
      visibility: "public",
    },
    include: {
      creator: true,
      monsterCollections: {
        where: {
          monster: { visibility: "public" },
        },
        include: {
          monster: true,
        },
      },
    },
  });

  return collections
    .filter((c) => c.monsterCollections.length > 0)
    .map((c) => {
      const legendaryCount = c.monsterCollections.filter(
        (m) => m.monster.legendary
      ).length;
      return {
        ...c,
        createdAt: c.createdAt ?? undefined,
        legendaryCount,
        standardCount: c.monsterCollections.length - legendaryCount,
        creator: { ...c.creator, avatar: c.creator.avatar || "" },
        monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
      };
    });
};

export const getUserPublicCollectionsCount = async (
  username: string
): Promise<number> => {
  return await prisma.collection.count({
    where: {
      creator: { username },
      visibility: "public",
    },
  });
};

export interface CreateCollectionInput {
  name: string;
  visibility: CollectionOverview["visibility"];
  description?: string;
  discordId: string;
}

export const createCollection = async ({
  name,
  visibility,
  description,
  discordId,
}: CreateCollectionInput): Promise<CollectionOverview> => {
  const collection = await prisma.collection.create({
    data: {
      name,
      visibility,
      description,
      creator: {
        connect: { discordId },
      },
    },
    include: {
      creator: true,
      monsterCollections: {
        include: {
          monster: {
            include: {
              creator: true,
              family: { include: { creator: true } },
              monsterConditions: { include: { condition: true } },
            },
          },
        },
      },
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    visibility: collection.visibility as CollectionOverview["visibility"],
    legendaryCount: 0,
    standardCount: 0,
    creator: {
      discordId: collection.creator.discordId,
      username: collection.creator.username,
      avatar: collection.creator.avatar || "",
    },
    monsters: collection.monsterCollections.map((mc) => toMonster(mc.monster)),
  };
};

export interface UpdateCollectionInput {
  id: string;
  name?: string;
  visibility?: CollectionOverview["visibility"];
  description?: string;
  discordId: string;
  monsterIds?: string[];
}

export const updateCollection = async ({
  id,
  name,
  visibility,
  description,
  discordId,
  monsterIds,
}: UpdateCollectionInput): Promise<CollectionOverview | null> => {
  if (!isValidUUID(id)) return null;

  try {
    // Check if collection exists and belongs to the user
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id,
        creator: { discordId },
      },
      include: {
        creator: true,
        monsterCollections: true,
      },
    });

    if (!existingCollection) {
      return null;
    }

    // Use a transaction to update collection and monster relationships atomically
    return await prisma.$transaction(async (tx) => {
      // Update the collection basic properties
      await tx.collection.update({
        where: {
          id,
        },
        data: {
          ...(name && { name }),
          ...(visibility && { visibility }),
          ...(description !== undefined && { description }),
          updatedAt: new Date(),
        },
        include: {
          creator: true,
          monsterCollections: {
            include: {
              monster: {
                include: {
                  family: { include: { creator: true } },
                  creator: true,
                  monsterConditions: { include: { condition: true } },
                },
              },
            },
          },
        },
      });

      // Update monster associations if monsterIds is provided
      if (monsterIds) {
        const existingMonsterIds = existingCollection.monsterCollections.map(
          (mc) => mc.monsterId
        );

        // Find monsters to remove and add
        const toRemove = existingMonsterIds.filter(
          (monsterId) => !monsterIds.includes(monsterId)
        );

        const toAdd = monsterIds.filter(
          (monsterId) => !existingMonsterIds.includes(monsterId)
        );

        // Remove monsters no longer in the collection
        if (toRemove.length > 0) {
          await tx.monsterInCollection.deleteMany({
            where: {
              collectionId: id,
              monsterId: { in: toRemove },
            },
          });
        }

        // Add new monsters to the collection
        if (toAdd.length > 0) {
          await tx.monsterInCollection.createMany({
            data: toAdd.map((monsterId) => ({
              collectionId: id,
              monsterId,
            })),
          });
        }
      }

      // Get the updated collection with the new monster relationships
      const updatedCollection = await tx.collection.findUnique({
        where: { id },
        include: {
          creator: true,
          monsterCollections: {
            include: {
              monster: {
                include: {
                  family: { include: { creator: true } },
                  creator: true,
                  monsterConditions: { include: { condition: true } },
                },
              },
            },
          },
        },
      });

      if (!updatedCollection) return null;

      // Count legendary monsters
      const legendaryCount = updatedCollection.monsterCollections.filter(
        (mc) => mc.monster.legendary
      ).length;

      // Return the updated collection overview
      return {
        id: updatedCollection.id,
        name: updatedCollection.name,
        visibility:
          updatedCollection.visibility as CollectionOverview["visibility"],
        legendaryCount,
        standardCount:
          updatedCollection.monsterCollections.length - legendaryCount,
        creator: {
          discordId: updatedCollection.creator.discordId,
          username: updatedCollection.creator.username,
          avatar: updatedCollection.creator.avatar || "",
        },
        monsters: updatedCollection.monsterCollections.map((mc) =>
          toMonster(mc.monster)
        ),
      };
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return null;
  }
};

export const deleteCollection = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  return await prisma.$transaction(async (tx) => {
    await tx.monsterInCollection.deleteMany({
      where: { collectionId: id },
    });

    const collection = await tx.collection.delete({
      where: {
        id: id,
        creator: { discordId },
      },
    });

    return !!collection;
  });
};

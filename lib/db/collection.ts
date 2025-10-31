import { toItem, toItemMini } from "@/lib/services/items/converters";
import type { Collection, CollectionOverview } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toMonster, toMonsterMini } from "../services/monsters/converters";
import { toCollectionOverview, toSpellSchool, toUser } from "./converters";
import { prisma } from "./index";

export const listCollectionsWithMonstersForUser = async (
  discordId: string
): Promise<CollectionOverview[]> => {
  const collections = await prisma.collection.findMany({
    where: { creator: { discordId: discordId } },
    include: {
      creator: true,
      monsterCollections: {
        include: {
          monster: true,
        },
        orderBy: { monster: { name: "asc" } },
      },
      itemCollections: {
        include: {
          item: true,
        },
        orderBy: { item: { name: "asc" } },
      },
      spellSchoolCollections: {
        include: {
          spellSchool: true,
        },
        orderBy: { spellSchool: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
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
      creator: toUser(c.creator),
      monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
      items: c.itemCollections.map((ic) => toItemMini(ic.item)),
      itemCount: c.itemCollections.length,
      spellSchools: c.spellSchoolCollections.map((sc) => ({
        id: sc.spellSchool.id,
        name: sc.spellSchool.name,
        visibility: sc.spellSchool.visibility,
        createdAt: sc.spellSchool.createdAt,
      })),
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
        itemCollections: {
          include: {
            item: true,
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
        orderBy: { monster: { name: "asc" } },
      },
      itemCollections: {
        where: { item: { visibility: "public" } },
        include: {
          item: {},
        },
        orderBy: { item: { name: "asc" } },
      },
      spellSchoolCollections: {
        include: {
          spellSchool: true,
        },
      },
    },
  });

  return collections
    .filter(
      (c) => c.monsterCollections.length > 0 || c.itemCollections.length > 0
    )
    .map((c) => {
      const legendaryCount = c.monsterCollections.filter(
        (m) => m.monster.legendary
      ).length;
      return {
        ...c,
        createdAt: c.createdAt ?? undefined,
        legendaryCount,
        standardCount: c.monsterCollections.length - legendaryCount,
        creator: toUser(c.creator),
        monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
        items: c.itemCollections.map((ic) => toItemMini(ic.item)),
        itemCount: c.itemCollections.length,
        spellSchools: c.spellSchoolCollections.map((sc) => ({
          id: sc.spellSchool.id,
          name: sc.spellSchool.name,
          visibility: sc.spellSchool.visibility,
          createdAt: sc.spellSchool.createdAt,
        })),
      };
    });
};

export const getCollection = async (
  id: string,
  viewerDiscordId?: string
): Promise<Collection | null> => {
  const c = await prisma.collection.findUnique({
    where: { id },
    include: {
      creator: true,
      monsterCollections: {
        include: {
          monster: {
            include: {
              monsterFamilies: {
                include: { family: { include: { creator: true } } },
              },
              creator: true,
              source: true,
              monsterConditions: { include: { condition: true } },
              monsterAwards: { include: { award: true } },
              remixedFrom: { include: { creator: true } },
            },
          },
        },
      },
      itemCollections: {
        include: {
          item: {
            include: {
              creator: true,
              source: true,
              itemAwards: { include: { award: true } },
            },
          },
        },
      },
      spellSchoolCollections: {
        include: {
          spellSchool: {
            include: {
              creator: true,
              source: true,
              spells: {
                orderBy: [{ tier: "asc" }, { name: "asc" }],
              },
              schoolAwards: { include: { award: true } },
            },
          },
        },
      },
    },
  });
  if (!c) return c;

  // Check if viewer is the collection owner
  const isOwner = viewerDiscordId && c.creator.discordId === viewerDiscordId;

  // Filter monsters and items by visibility if viewer is not the owner
  const filteredMonsterCollections = isOwner
    ? c.monsterCollections
    : c.monsterCollections.filter((mc) => mc.monster.visibility === "public");

  const filteredItemCollections = isOwner
    ? c.itemCollections
    : c.itemCollections.filter((ic) => ic.item.visibility === "public");

  const filteredSpellSchoolCollections = isOwner
    ? c.spellSchoolCollections
    : c.spellSchoolCollections.filter(
        (sc) => sc.spellSchool.visibility === "public"
      );

  const legendaryCount = filteredMonsterCollections.filter(
    (m) => m.monster.legendary
  ).length;
  return {
    ...c,
    createdAt: c.createdAt ?? undefined,
    legendaryCount,
    standardCount: filteredMonsterCollections.length - legendaryCount,
    creator: toUser(c.creator),
    monsters: filteredMonsterCollections
      .flatMap((mc) => toMonster(mc.monster))
      .sort((a, b) => a.name.localeCompare(b.name)),
    items: filteredItemCollections
      .flatMap((ic) => toItem(ic.item))
      .sort((a, b) => a.name.localeCompare(b.name)),
    itemCount: filteredItemCollections.length,
    spellSchools: filteredSpellSchoolCollections
      .map((sc) => toSpellSchool(sc.spellSchool))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

export const listPublicCollectionsHavingMonstersForUser = async (
  creatorId: string
): Promise<CollectionOverview[]> => {
  const collections = await prisma.collection.findMany({
    where: {
      creatorId,
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
      itemCollections: {
        where: {
          item: { visibility: "public" },
        },
        include: {
          item: true,
        },
      },
      spellSchoolCollections: {
        include: {
          spellSchool: true,
        },
      },
    },
  });

  return collections
    .filter(
      (c) => c.monsterCollections.length > 0 || c.itemCollections.length > 0
    )
    .map((c) => {
      const legendaryCount = c.monsterCollections.filter(
        (m) => m.monster.legendary
      ).length;
      return {
        ...c,
        createdAt: c.createdAt ?? undefined,
        legendaryCount,
        standardCount: c.monsterCollections.length - legendaryCount,
        creator: toUser(c.creator),
        monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
        items: c.itemCollections.map((ic) => toItemMini(ic.item)),
        itemCount: c.itemCollections.length,
        spellSchools: c.spellSchoolCollections.map((sc) => ({
          id: sc.spellSchool.id,
          name: sc.spellSchool.name,
          visibility: sc.spellSchool.visibility,
          createdAt: sc.spellSchool.createdAt,
        })),
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
              source: true,
              monsterFamilies: {
                include: { family: { include: { creator: true } } },
              },
              monsterConditions: { include: { condition: true } },
              monsterAwards: { include: { award: true } },
              remixedFrom: { include: { creator: true } },
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
    creator: toUser(collection.creator),
    monsters: collection.monsterCollections.map((mc) => toMonster(mc.monster)),
    items: [],
    itemCount: 0,
    spellSchools: [],
  };
};

export interface UpdateCollectionInput {
  id: string;
  name?: string;
  visibility?: CollectionOverview["visibility"];
  description?: string;
  discordId: string;
  monsterIds?: string[];
  itemIds?: string[];
}

export const updateCollection = async ({
  id,
  name,
  visibility,
  description,
  discordId,
  monsterIds,
  itemIds,
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
        itemCollections: true,
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
                  monsterFamilies: {
                    include: { family: { include: { creator: true } } },
                  },
                  creator: true,
                  source: true,
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

      // Update item associations if itemIds is provided
      if (itemIds) {
        const existingItemIds = existingCollection.itemCollections.map(
          (ic) => ic.itemId
        );

        // Find items to remove and add
        const toRemove = existingItemIds.filter(
          (itemId) => !itemIds.includes(itemId)
        );

        const toAdd = itemIds.filter(
          (itemId) => !existingItemIds.includes(itemId)
        );

        // Remove items no longer in the collection
        if (toRemove.length > 0) {
          await tx.itemInCollection.deleteMany({
            where: {
              collectionId: id,
              itemId: { in: toRemove },
            },
          });
        }

        // Add new items to the collection
        if (toAdd.length > 0) {
          await tx.itemInCollection.createMany({
            data: toAdd.map((itemId) => ({
              collectionId: id,
              itemId,
            })),
          });
        }
      }

      // Get the updated collection with the new monster and item relationships
      const updatedCollection = await tx.collection.findUnique({
        where: { id },
        include: {
          creator: true,
          monsterCollections: {
            include: {
              monster: {
                include: {
                  monsterFamilies: {
                    include: { family: { include: { creator: true } } },
                  },
                  creator: true,
                  source: true,
                  monsterConditions: { include: { condition: true } },
                  monsterAwards: { include: { award: true } },
                  remixedFrom: { include: { creator: true } },
                },
              },
            },
          },
          itemCollections: {
            include: {
              item: {
                include: {
                  creator: true,
                  source: true,
                  itemAwards: { include: { award: true } },
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
        creator: toUser(updatedCollection.creator),
        monsters: updatedCollection.monsterCollections.map((mc) =>
          toMonster(mc.monster)
        ),
        items: updatedCollection.itemCollections.map((ic) => toItem(ic.item)),
        itemCount: updatedCollection.itemCollections.length,
        spellSchools: [],
      };
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return null;
  }
};

export const addMonsterToCollection = async ({
  monsterId,
  collectionId,
}: {
  monsterId: string;
  collectionId: string;
}): Promise<boolean> => {
  if (!isValidUUID(monsterId) || !isValidUUID(collectionId)) return false;

  await prisma.monsterInCollection.create({
    data: { monsterId, collectionId },
  });
  return true;
};

export const addItemToCollection = async ({
  itemId,
  collectionId,
}: {
  itemId: string;
  collectionId: string;
}): Promise<boolean> => {
  if (!isValidUUID(itemId) || !isValidUUID(collectionId)) return false;

  await prisma.itemInCollection.create({
    data: { itemId, collectionId },
  });
  return true;
};

export const addSpellSchoolToCollection = async ({
  spellSchoolId,
  collectionId,
}: {
  spellSchoolId: string;
  collectionId: string;
}): Promise<boolean> => {
  if (!isValidUUID(spellSchoolId) || !isValidUUID(collectionId)) return false;

  await prisma.spellSchoolInCollection.create({
    data: { spellSchoolId, collectionId },
  });
  return true;
};

export const findSpellSchoolCollections = async (spellSchoolId: string) => {
  if (!isValidUUID(spellSchoolId)) return [];

  const collections = await prisma.collection.findMany({
    where: {
      spellSchoolCollections: {
        some: { spellSchoolId },
      },
      visibility: "public",
    },
    include: {
      creator: true,
    },
    orderBy: { name: "asc" },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    creator: toUser(collection.creator),
  }));
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

    await tx.itemInCollection.deleteMany({
      where: { collectionId: id },
    });

    await tx.spellSchoolInCollection.deleteMany({
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

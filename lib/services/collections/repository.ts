import { toItem, toItemMini } from "@/lib/services/items/converters";
import { toMonster, toMonsterMini } from "@/lib/services/monsters/converters";
import type { Collection, CollectionOverview } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import { toUser } from "../../db/converters";
import { prisma } from "../../db/index";

export interface ListCollectionsParams {
  cursor?: string;
  limit?: number;
  sort?: "name" | "-name" | "createdAt" | "-createdAt";
}

export const listPublicCollections = async ({
  cursor,
  limit = 100,
  sort = "name",
}: ListCollectionsParams): Promise<{
  collections: CollectionOverview[];
  nextCursor: string | null;
}> => {
  const cursorData = cursor ? decodeCursor(cursor) : null;

  if (cursorData && cursorData.sort !== sort) {
    throw new Error(
      `Cursor sort mismatch: cursor has '${cursorData.sort}' but request has '${sort}'`
    );
  }

  const isDesc = sort.startsWith("-");
  const sortField = isDesc ? sort.slice(1) : sort;
  const sortDir = isDesc ? "desc" : "asc";

  let orderBy:
    | [{ name: "asc" | "desc" }, { id: "asc" | "desc" }]
    | [{ createdAt: "asc" | "desc" }, { id: "asc" | "desc" }];

  if (sortField === "name") {
    orderBy = [{ name: sortDir }, { id: "asc" }];
  } else {
    orderBy = [{ createdAt: sortDir }, { id: "asc" }];
  }

  const where: {
    visibility: "public";
    OR?: Array<{
      name?: { gt?: string; lt?: string };
      createdAt?: { gt?: Date; lt?: Date };
      AND?: Array<{
        name?: string;
        createdAt?: Date;
        id?: { gt: string };
      }>;
    }>;
  } = { visibility: "public" };

  if (cursorData) {
    const op = isDesc ? "lt" : "gt";

    if (sortField === "name") {
      where.OR = [
        { name: { [op]: cursorData.value as string } },
        {
          AND: [
            { name: cursorData.value as string },
            { id: { gt: cursorData.id } },
          ],
        },
      ];
    } else if (sortField === "createdAt") {
      const date = new Date(cursorData.value as string);
      where.OR = [
        { createdAt: { [op]: date } },
        { AND: [{ createdAt: date }, { id: { gt: cursorData.id } }] },
      ];
    }
  }

  const collections = await prisma.collection.findMany({
    where,
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
    },
    orderBy,
    take: limit + 1,
  });

  const filtered = collections.filter(
    (c) => c.monsterCollections.length > 0 || c.itemCollections.length > 0
  );

  const hasMore = filtered.length > limit;
  const results = hasMore ? filtered.slice(0, limit) : filtered;

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastCollection = results[results.length - 1];
    let cursorData: CursorData;

    if (sortField === "name") {
      cursorData = {
        sort: sort as "name" | "-name",
        value: lastCollection.name,
        id: lastCollection.id,
      };
    } else {
      cursorData = {
        sort: sort as "createdAt" | "-createdAt",
        value: (lastCollection.createdAt ?? new Date()).toISOString(),
        id: lastCollection.id,
      };
    }

    nextCursor = encodeCursor(cursorData);
  }

  return {
    collections: results.map((c) => {
      const legendaryCount = c.monsterCollections.filter(
        (m) => m.monster.legendary
      ).length;
      return {
        id: c.id,
        creator: toUser(c.creator),
        description: c.description ?? undefined,
        legendaryCount,
        monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
        name: c.name,
        standardCount: c.monsterCollections.length - legendaryCount,
        visibility: c.visibility === "private" ? "private" : "public",
        createdAt: c.createdAt ?? undefined,
        items: c.itemCollections?.map((ic) => toItemMini(ic.item)) || [],
        itemCount: c.itemCollections?.length || 0,
      };
    }),
    nextCursor,
  };
};

export const findPublicCollectionById = async (
  id: string
): Promise<Collection | null> => {
  if (!isValidUUID(id)) return null;

  const c = await prisma.collection.findUnique({
    where: { id, visibility: "public" },
    include: {
      creator: true,
      monsterCollections: {
        where: { monster: { visibility: "public" } },
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
      itemCollections: {
        where: { item: { visibility: "public" } },
        include: {
          item: {
            include: {
              creator: true,
              source: true,
            },
          },
        },
      },
    },
  });

  if (!c) return null;

  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary
  ).length;

  return {
    id: c.id,
    name: c.name,
    description: c.description ?? undefined,
    visibility: c.visibility === "private" ? "private" : "public",
    createdAt: c.createdAt ?? undefined,
    legendaryCount,
    standardCount: c.monsterCollections.length - legendaryCount,
    creator: toUser(c.creator),
    monsters: c.monsterCollections
      .flatMap((mc) => toMonster(mc.monster))
      .sort((a, b) => a.name.localeCompare(b.name)),
    items: c.itemCollections
      .flatMap((ic) => toItem(ic.item))
      .sort((a, b) => a.name.localeCompare(b.name)),
    itemCount: c.itemCollections.length,
  };
};

"use server";
import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import type { AwardRow, SourceRow } from "@/lib/db/schema";
import {
  awards,
  collections,
  items,
  itemsAwards,
  itemsCollections,
  sources,
  type UserRow,
  users,
} from "@/lib/db/schema";
import type { Source, User } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import type {
  CreateItemInput,
  Item,
  ItemMini,
  ItemRarity,
  PaginateItemsParams,
  SearchItemsParams,
  UpdateItemInput,
} from "./types";

const toUserFromRow = (u: UserRow): User => ({
  id: u.id,
  discordId: u.discordId ?? "",
  username: u.username ?? "",
  displayName: u.displayName || u.username || "",
  imageUrl:
    u.imageUrl ||
    (u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png"),
});

const toSourceFromRow = (s: SourceRow | null): Source | undefined => {
  if (!s) return undefined;
  return {
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  };
};

const toAwardFromRow = (a: AwardRow) => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  abbreviation: a.abbreviation,
  description: a.description,
  url: a.url,
  color: a.color,
  icon: a.icon,
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
});

interface ItemFullData {
  item: typeof items.$inferSelect;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

const toItemFromFullData = (data: ItemFullData): Item => ({
  id: data.item.id,
  name: data.item.name,
  kind: data.item.kind || undefined,
  rarity: (data.item.rarity ?? "unspecified") as ItemRarity,
  visibility: (data.item.visibility ?? "public") as "public" | "private",
  imageIcon: data.item.imageIcon || undefined,
  imageBgIcon: data.item.imageBgIcon || undefined,
  imageColor: data.item.imageColor || undefined,
  imageBgColor: data.item.imageBgColor || undefined,
  createdAt: data.item.createdAt ? new Date(data.item.createdAt) : new Date(),
  updatedAt: data.item.updatedAt ? new Date(data.item.updatedAt) : new Date(),
  description: data.item.description,
  moreInfo: data.item.moreInfo || undefined,
  creator: toUserFromRow(data.creator),
  source: toSourceFromRow(data.source),
  awards: data.awards.map(toAwardFromRow),
});

const toItemMiniFromRow = (item: typeof items.$inferSelect): ItemMini => ({
  id: item.id,
  name: item.name,
  kind: item.kind || undefined,
  rarity: (item.rarity ?? "unspecified") as ItemRarity,
  visibility: (item.visibility ?? "public") as "public" | "private",
  imageIcon: item.imageIcon || undefined,
  imageBgIcon: item.imageBgIcon || undefined,
  imageColor: item.imageColor || undefined,
  imageBgColor: item.imageBgColor || undefined,
  createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
  updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
});

async function loadItemFullData(
  db: Awaited<ReturnType<typeof getDatabase>>,
  itemIds: string[]
): Promise<Map<string, ItemFullData>> {
  if (itemIds.length === 0) return new Map();

  // Get base item data with creator and source
  const itemRows = await db
    .select()
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .leftJoin(sources, eq(items.sourceId, sources.id))
    .where(inArray(items.id, itemIds));

  // Get awards for all items
  const awardRows = await db
    .select({ itemId: itemsAwards.itemId, award: awards })
    .from(itemsAwards)
    .innerJoin(awards, eq(itemsAwards.awardId, awards.id))
    .where(inArray(itemsAwards.itemId, itemIds));

  // Group awards by item
  const awardsByItem = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByItem.get(row.itemId) || [];
    existing.push(row.award);
    awardsByItem.set(row.itemId, existing);
  }

  const result = new Map<string, ItemFullData>();
  for (const row of itemRows) {
    result.set(row.items.id, {
      item: row.items,
      creator: row.users,
      source: row.sources,
      awards: awardsByItem.get(row.items.id) || [],
    });
  }

  return result;
}

export const deleteItem = async (
  id: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const db = await getDatabase();

  // Get user by discordId
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;
  const user = userResult[0];

  // Delete the item (only if it belongs to the user)
  const result = await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.userId, user.id)));

  return result.rowsAffected > 0;
};

export const listPublicItems = async (): Promise<ItemMini[]> => {
  const db = await getDatabase();

  const itemRows = await db
    .select()
    .from(items)
    .where(eq(items.visibility, "public"))
    .orderBy(asc(items.name));

  return itemRows.map(toItemMiniFromRow);
};

export const getRandomRecentItems = async (
  limit: number = 3
): Promise<Item[]> => {
  const db = await getDatabase();

  // Get recent public items
  const itemRows = await db
    .select()
    .from(items)
    .where(eq(items.visibility, "public"))
    .orderBy(desc(items.createdAt))
    .limit(limit * 3);

  if (itemRows.length === 0) return [];

  const itemIds = itemRows.map((r) => r.id);
  const itemDataMap = await loadItemFullData(db, itemIds);

  // Convert to Item array
  const convertedItems = itemIds
    .map((id) => itemDataMap.get(id))
    .filter((i): i is ItemFullData => i !== undefined)
    .map(toItemFromFullData);

  const shuffled = convertedItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const findItem = async (id: string): Promise<Item | null> => {
  const db = await getDatabase();

  const itemDataMap = await loadItemFullData(db, [id]);
  const itemData = itemDataMap.get(id);
  return itemData ? toItemFromFullData(itemData) : null;
};

export const findItemsByIds = async (ids: string[]): Promise<Item[]> => {
  const validIds = ids.filter(isValidUUID);
  if (validIds.length === 0) return [];

  const db = await getDatabase();
  const itemDataMap = await loadItemFullData(db, validIds);

  return validIds
    .map((id) => itemDataMap.get(id))
    .filter((i): i is ItemFullData => i !== undefined)
    .map(toItemFromFullData);
};

export const findItemCollections = async (itemId: string) => {
  if (!isValidUUID(itemId)) return [];

  const db = await getDatabase();

  // Get collection IDs that contain this item
  const collectionLinks = await db
    .select({ collectionId: itemsCollections.collectionId })
    .from(itemsCollections)
    .where(eq(itemsCollections.itemId, itemId));

  if (collectionLinks.length === 0) return [];

  const collectionIds = collectionLinks.map((l) => l.collectionId);

  // Get public collections with their creators
  const collectionRows = await db
    .select()
    .from(collections)
    .innerJoin(users, eq(collections.creatorId, users.id))
    .where(
      and(
        inArray(collections.id, collectionIds),
        eq(collections.visibility, "public")
      )
    )
    .orderBy(asc(collections.name));

  return collectionRows.map((row) => ({
    id: row.collections.id,
    name: row.collections.name,
    creator: toUserFromRow(row.users),
  }));
};

export const findPublicItemById = async (id: string): Promise<Item | null> => {
  const db = await getDatabase();

  // First check if item is public
  const itemCheck = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, id), eq(items.visibility, "public")))
    .limit(1);

  if (itemCheck.length === 0) return null;

  const itemDataMap = await loadItemFullData(db, [id]);
  const itemData = itemDataMap.get(id);
  return itemData ? toItemFromFullData(itemData) : null;
};

export const findItemWithCreatorDiscordId = async (
  id: string,
  creatorId: string
): Promise<Item | null> => {
  const db = await getDatabase();

  // Check if item belongs to the specified creator
  const itemCheck = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, creatorId)))
    .limit(1);

  if (itemCheck.length === 0) return null;

  const itemDataMap = await loadItemFullData(db, [id]);
  const itemData = itemDataMap.get(id);
  return itemData ? toItemFromFullData(itemData) : null;
};

export const listPublicItemsForUser = async (
  userId: string
): Promise<Item[]> => {
  const db = await getDatabase();

  // Get public item IDs for this user
  const itemRows = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.visibility, "public")))
    .orderBy(asc(items.name));

  if (itemRows.length === 0) return [];

  const itemIds = itemRows.map((r) => r.id);
  const itemDataMap = await loadItemFullData(db, itemIds);

  return itemIds
    .map((id) => itemDataMap.get(id))
    .filter((i): i is ItemFullData => i !== undefined)
    .map(toItemFromFullData);
};

export const listAllItemsForDiscordID = async (
  discordId: string
): Promise<Item[]> => {
  const db = await getDatabase();

  // Get user by discordId
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  // Get all item IDs for this user
  const itemRows = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.userId, user.id))
    .orderBy(asc(items.name));

  if (itemRows.length === 0) return [];

  const itemIds = itemRows.map((r) => r.id);
  const itemDataMap = await loadItemFullData(db, itemIds);

  return itemIds
    .map((id) => itemDataMap.get(id))
    .filter((i): i is ItemFullData => i !== undefined)
    .map(toItemFromFullData);
};

export const searchPublicItems = async ({
  searchTerm,
  rarity,
  creatorId,
  source,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchItemsParams & { offset?: number }): Promise<Item[]> => {
  const db = await getDatabase();

  // Build conditions
  const conditions = [eq(items.visibility, "public")];

  if (creatorId) {
    conditions.push(eq(items.userId, creatorId));
  }

  if (searchTerm) {
    conditions.push(
      or(
        like(items.name, `%${searchTerm}%`),
        like(items.kind, `%${searchTerm}%`)
      ) as ReturnType<typeof eq>
    );
  }

  if (rarity && rarity !== "all") {
    conditions.push(eq(items.rarity, rarity));
  }

  if (source) {
    const sourceRow = await db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.abbreviation, source))
      .limit(1);
    if (sourceRow.length > 0) {
      conditions.push(eq(items.sourceId, sourceRow[0].id));
    } else {
      return [];
    }
  }

  // Determine order
  const orderColumn = sortBy === "name" ? items.name : items.createdAt;
  const orderFn = sortDirection === "desc" ? desc : asc;

  // Build query
  let query = db
    .select({ id: items.id })
    .from(items)
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn))
    .$dynamic();

  if (limit) {
    query = query.limit(limit);
  }
  if (offset) {
    query = query.offset(offset);
  }

  const itemRows = await query;
  if (itemRows.length === 0) return [];

  const itemIds = itemRows.map((r) => r.id);
  const itemDataMap = await loadItemFullData(db, itemIds);

  return itemIds
    .map((id) => itemDataMap.get(id))
    .filter((i): i is ItemFullData => i !== undefined)
    .map(toItemFromFullData);
};

function buildItemCursorCondition(
  sortField: string,
  isDesc: boolean,
  cursorData: CursorData
) {
  if (sortField === "name") {
    const cursorValue = cursorData.value as string;
    if (isDesc) {
      return or(
        lt(items.name, cursorValue),
        and(eq(items.name, cursorValue), gt(items.id, cursorData.id))
      );
    }
    return or(
      gt(items.name, cursorValue),
      and(eq(items.name, cursorValue), gt(items.id, cursorData.id))
    );
  }

  if (sortField === "createdAt") {
    const cursorValue = cursorData.value as string;
    if (isDesc) {
      return or(
        lt(items.createdAt, cursorValue),
        and(eq(items.createdAt, cursorValue), gt(items.id, cursorData.id))
      );
    }
    return or(
      gt(items.createdAt, cursorValue),
      and(eq(items.createdAt, cursorValue), gt(items.id, cursorData.id))
    );
  }

  return undefined;
}

export const paginateItems = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  rarity,
  creatorId,
  source,
  includePrivate = false,
}: PaginateItemsParams & { includePrivate?: boolean }): Promise<{
  data: Item[];
  nextCursor: string | null;
}> => {
  const db = await getDatabase();

  const cursorData = cursor ? decodeCursor(cursor) : null;

  if (cursorData && cursorData.sort !== sort) {
    throw new Error(
      `Cursor sort mismatch: cursor has '${cursorData.sort}' but request has '${sort}'`
    );
  }

  const isDesc = sort.startsWith("-");
  const sortField = isDesc ? sort.slice(1) : sort;

  // Build conditions array
  const whereConditions: ReturnType<typeof eq>[] = [];

  if (!includePrivate) {
    whereConditions.push(eq(items.visibility, "public"));
  }

  if (creatorId) {
    whereConditions.push(eq(items.userId, creatorId));
  }

  if (source) {
    const sourceRow = await db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.abbreviation, source))
      .limit(1);
    if (sourceRow.length === 0) return { data: [], nextCursor: null };
    whereConditions.push(eq(items.sourceId, sourceRow[0].id));
  }

  if (rarity && rarity !== "all") {
    whereConditions.push(eq(items.rarity, rarity));
  }

  // Build the query
  let query = db.select({ id: items.id }).from(items).$dynamic();

  // Add search condition
  if (search) {
    const searchCondition = or(
      like(items.name, `%${search}%`),
      like(items.kind, `%${search}%`)
    );
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions, searchCondition));
    } else {
      query = query.where(searchCondition);
    }
  } else if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }

  // Add cursor pagination
  if (cursorData) {
    const cursorCondition = buildItemCursorCondition(
      sortField,
      isDesc,
      cursorData
    );
    if (cursorCondition) {
      // Re-build with cursor condition
      const baseConditions = search
        ? [
            ...whereConditions,
            or(
              like(items.name, `%${search}%`),
              like(items.kind, `%${search}%`)
            ),
          ]
        : whereConditions;

      if (baseConditions.length > 0) {
        query = db
          .select({ id: items.id })
          .from(items)
          .where(and(...baseConditions, cursorCondition))
          .$dynamic();
      } else {
        query = db
          .select({ id: items.id })
          .from(items)
          .where(cursorCondition)
          .$dynamic();
      }
    }
  }

  // Add ordering
  if (sortField === "name") {
    query = query.orderBy(
      isDesc ? desc(items.name) : asc(items.name),
      asc(items.id)
    );
  } else {
    query = query.orderBy(
      isDesc ? desc(items.createdAt) : asc(items.createdAt),
      asc(items.id)
    );
  }

  // Execute with limit + 1 to check for more
  const itemIdRows = await query.limit(limit + 1);

  const hasMore = itemIdRows.length > limit;
  const resultIds = hasMore
    ? itemIdRows.slice(0, limit).map((r) => r.id)
    : itemIdRows.map((r) => r.id);

  // Load full data for result IDs
  const itemDataMap = await loadItemFullData(db, resultIds);

  // Convert to Item array maintaining order
  const results = resultIds
    .map((id) => itemDataMap.get(id))
    .filter((i): i is ItemFullData => i !== undefined)
    .map(toItemFromFullData);

  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastId = resultIds[resultIds.length - 1];
    const lastItemData = itemDataMap.get(lastId);
    if (lastItemData) {
      const lastRow = lastItemData.item;
      let newCursorData: CursorData;

      if (sortField === "name") {
        newCursorData = {
          sort: sort as "name" | "-name",
          value: lastRow.name,
          id: lastRow.id,
        };
      } else {
        newCursorData = {
          sort: sort as "createdAt" | "-createdAt",
          value: lastRow.createdAt ?? "",
          id: lastRow.id,
        };
      }

      nextCursor = encodeCursor(newCursorData);
    }
  }

  return {
    data: results,
    nextCursor,
  };
};

export const createItem = async (
  input: CreateItemInput,
  discordId: string
): Promise<Item> => {
  const db = await getDatabase();

  const {
    name,
    kind = "",
    description,
    moreInfo = "",
    imageIcon,
    imageBgIcon,
    imageColor,
    imageBgColor,
    rarity,
    visibility,
    sourceId,
    remixedFromId,
  } = input;

  // Get user by discordId
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  // Insert the item
  const itemId = crypto.randomUUID();
  await db.insert(items).values({
    id: itemId,
    name,
    kind,
    description,
    moreInfo,
    imageIcon,
    imageBgIcon,
    imageColor,
    imageBgColor,
    rarity,
    visibility,
    userId: user.id,
    sourceId: sourceId || null,
    remixedFromId: remixedFromId || null,
  });

  // Load the created item with full data
  const itemDataMap = await loadItemFullData(db, [itemId]);
  const itemData = itemDataMap.get(itemId);

  if (!itemData) {
    throw new Error("Failed to create item");
  }

  return toItemFromFullData(itemData);
};

export const updateItem = async (
  id: string,
  input: UpdateItemInput,
  discordId: string
): Promise<Item> => {
  if (!isValidUUID(id)) {
    throw new Error("Invalid item ID");
  }

  const db = await getDatabase();

  const {
    name,
    kind = "",
    description,
    moreInfo = "",
    imageIcon,
    imageBgIcon,
    imageColor,
    imageBgColor,
    rarity,
    visibility,
    sourceId,
  } = input;

  // Get user by discordId
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  // Verify item exists and belongs to user
  const existingItem = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, user.id)))
    .limit(1);

  if (existingItem.length === 0) {
    throw new Error("Item not found");
  }

  // Update the item
  await db
    .update(items)
    .set({
      name,
      kind,
      description,
      moreInfo,
      imageIcon,
      imageBgIcon,
      imageColor,
      imageBgColor,
      rarity,
      visibility,
      sourceId: sourceId || null,
    })
    .where(eq(items.id, id));

  // Load the updated item with full data
  const itemDataMap = await loadItemFullData(db, [id]);
  const itemData = itemDataMap.get(id);

  if (!itemData) {
    throw new Error("Failed to update item");
  }

  return toItemFromFullData(itemData);
};

export const findItemRemixes = async (itemId: string) => {
  if (!isValidUUID(itemId)) return [];

  const db = await getDatabase();

  const remixRows = await db
    .select()
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .where(and(eq(items.remixedFromId, itemId), eq(items.visibility, "public")))
    .orderBy(asc(items.name));

  return remixRows.map((row) => ({
    id: row.items.id,
    name: row.items.name,
    creator: toUserFromRow(row.users),
  }));
};

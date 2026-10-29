import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { items, sources } from "@/lib/db/schema";
import { loadItemFullData, toItemFromFullData } from "./loader";
import type { Item, SearchItemsParams } from "./types";

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
  const conditions = [eq(items.visibility, "public")];
  if (creatorId) conditions.push(eq(items.userId, creatorId));
  const searchCondition = searchTerm
    ? or(
        like(items.name, `%${searchTerm}%`),
        like(items.kind, `%${searchTerm}%`)
      )
    : undefined;
  if (rarity && rarity !== "all") conditions.push(eq(items.rarity, rarity));
  if (source) {
    const sourceRow = await db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.abbreviation, source))
      .limit(1);
    if (!sourceRow.length) return [];
    conditions.push(eq(items.sourceId, sourceRow[0].id));
  }
  const orderColumn =
    sortBy === "name"
      ? items.name
      : sortBy === "likes"
        ? items.likeCount
        : items.createdAt;
  const orderFn = sortDirection === "desc" ? desc : asc;
  let query = db
    .select({ id: items.id })
    .from(items)
    .where(and(...conditions, searchCondition))
    .orderBy(orderFn(orderColumn))
    .$dynamic();
  if (limit) query = query.limit(limit);
  if (offset) query = query.offset(offset);
  const itemRows = await query;
  const itemIds = itemRows.map((row) => row.id);
  const itemDataMap = await loadItemFullData(db, itemIds);
  return itemIds.flatMap((id) => {
    const item = itemDataMap.get(id);
    return item ? [toItemFromFullData(item)] : [];
  });
};

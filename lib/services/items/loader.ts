import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db/drizzle";
import type { AwardRow, SourceRow, UserRow } from "@/lib/db/schema";
import { awards, items, itemsAwards, sources, users } from "@/lib/db/schema";
import type { Source, User } from "@/lib/types";
import type { Item, ItemRarity } from "./types";

export const toUserFromRow = (u: UserRow): User => ({
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

export interface ItemFullData {
  item: typeof items.$inferSelect;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

export const toItemFromFullData = (data: ItemFullData): Item => ({
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
  imageBackdrop: data.item.imageBackdrop || undefined,
  creator: toUserFromRow(data.creator),
  source: toSourceFromRow(data.source),
  awards: data.awards.map(toAwardFromRow),
});

export async function loadItemFullData(
  db: Database,
  itemIds: string[]
): Promise<Map<string, ItemFullData>> {
  if (!itemIds.length) return new Map();
  const itemRows = await db
    .select()
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .leftJoin(sources, eq(items.sourceId, sources.id))
    .where(inArray(items.id, itemIds));
  const awardRows = await db
    .select({ itemId: itemsAwards.itemId, award: awards })
    .from(itemsAwards)
    .innerJoin(awards, eq(itemsAwards.awardId, awards.id))
    .where(inArray(itemsAwards.itemId, itemIds));
  const awardsByItem = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByItem.get(row.itemId) || [];
    existing.push(row.award);
    awardsByItem.set(row.itemId, existing);
  }
  const result = new Map<string, ItemFullData>();
  for (const row of itemRows)
    result.set(row.items.id, {
      item: row.items,
      creator: row.users,
      source: row.sources,
      awards: awardsByItem.get(row.items.id) || [],
    });
  return result;
}

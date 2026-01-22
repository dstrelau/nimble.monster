import { desc, eq, inArray } from "drizzle-orm";
import { toItem } from "@/lib/services/items/converters";
import type { MonsterMini } from "@/lib/services/monsters/types";
import type { CollectionOverview, Family, User } from "@/lib/types";
import { toMonster } from "../services/monsters/converters";
import {
  toCollectionOverview,
  toCompanion,
  toFamilyOverview,
  toUser,
} from "./converters";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  awards,
  type CompanionRow,
  collections,
  companions,
  companionsAwards,
  type FamilyRow,
  families,
  type ItemRow,
  items,
  itemsAwards,
  itemsCollections,
  type MonsterRow,
  monsters,
  monstersAwards,
  monstersCollections,
  monstersFamilies,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "./schema";

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
      data: CollectionOverview;
    }
  | {
      type: "family";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: Family & { monsters: MonsterMini[] };
    };

interface MonsterFullData {
  monster: MonsterRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
  families: Array<{ family: FamilyRow; creator: UserRow }>;
  remixedFrom: { id: string; name: string; creator: UserRow } | null;
}

interface ItemFullData {
  item: ItemRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

interface CompanionFullData {
  companion: CompanionRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

async function loadMonstersFullData(
  db: ReturnType<typeof getDatabase>,
  monsterIds: string[]
): Promise<Map<string, MonsterFullData>> {
  if (monsterIds.length === 0) return new Map();

  const monsterRows = await db
    .select()
    .from(monsters)
    .innerJoin(users, eq(monsters.userId, users.id))
    .leftJoin(sources, eq(monsters.sourceId, sources.id))
    .where(inArray(monsters.id, monsterIds));

  const awardRows = await db
    .select({ monsterId: monstersAwards.monsterId, award: awards })
    .from(monstersAwards)
    .innerJoin(awards, eq(monstersAwards.awardId, awards.id))
    .where(inArray(monstersAwards.monsterId, monsterIds));

  const familyRows = await db
    .select({
      monsterId: monstersFamilies.monsterId,
      family: families,
      creator: users,
    })
    .from(monstersFamilies)
    .innerJoin(families, eq(monstersFamilies.familyId, families.id))
    .innerJoin(users, eq(families.creatorId, users.id))
    .where(inArray(monstersFamilies.monsterId, monsterIds));

  const remixedFromIds = monsterRows
    .map((r) => r.monsters.remixedFromId)
    .filter((id): id is string => id !== null);

  const remixedFromMap = new Map<
    string,
    { id: string; name: string; creator: UserRow }
  >();
  if (remixedFromIds.length > 0) {
    const remixedFromRows = await db
      .select({ monster: monsters, creator: users })
      .from(monsters)
      .innerJoin(users, eq(monsters.userId, users.id))
      .where(inArray(monsters.id, remixedFromIds));

    for (const row of remixedFromRows) {
      remixedFromMap.set(row.monster.id, {
        id: row.monster.id,
        name: row.monster.name,
        creator: row.creator,
      });
    }
  }

  const awardsByMonster = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByMonster.get(row.monsterId) || [];
    existing.push(row.award);
    awardsByMonster.set(row.monsterId, existing);
  }

  const familiesByMonster = new Map<
    string,
    Array<{ family: FamilyRow; creator: UserRow }>
  >();
  for (const row of familyRows) {
    const existing = familiesByMonster.get(row.monsterId) || [];
    existing.push({ family: row.family, creator: row.creator });
    familiesByMonster.set(row.monsterId, existing);
  }

  const result = new Map<string, MonsterFullData>();
  for (const row of monsterRows) {
    result.set(row.monsters.id, {
      monster: row.monsters,
      creator: row.users,
      source: row.sources,
      awards: awardsByMonster.get(row.monsters.id) || [],
      families: familiesByMonster.get(row.monsters.id) || [],
      remixedFrom: row.monsters.remixedFromId
        ? remixedFromMap.get(row.monsters.remixedFromId) || null
        : null,
    });
  }

  return result;
}

async function loadItemsFullData(
  db: ReturnType<typeof getDatabase>,
  itemIds: string[]
): Promise<Map<string, ItemFullData>> {
  if (itemIds.length === 0) return new Map();

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

async function loadCompanionsFullData(
  db: ReturnType<typeof getDatabase>,
  companionIds: string[]
): Promise<Map<string, CompanionFullData>> {
  if (companionIds.length === 0) return new Map();

  const companionRows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(inArray(companions.id, companionIds));

  const awardRows = await db
    .select({ companionId: companionsAwards.companionId, award: awards })
    .from(companionsAwards)
    .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
    .where(inArray(companionsAwards.companionId, companionIds));

  const awardsByCompanion = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByCompanion.get(row.companionId) || [];
    existing.push(row.award);
    awardsByCompanion.set(row.companionId, existing);
  }

  const result = new Map<string, CompanionFullData>();
  for (const row of companionRows) {
    result.set(row.companions.id, {
      companion: row.companions,
      creator: row.users,
      source: row.sources,
      awards: awardsByCompanion.get(row.companions.id) || [],
    });
  }

  return result;
}

function toMonsterDataForConverter(data: MonsterFullData) {
  return {
    ...data.monster,
    creator: data.creator,
    source: data.source,
    monsterFamilies: data.families.map((f) => ({
      family: {
        ...f.family,
        creator: f.creator,
      },
    })),
    monsterAwards: data.awards.map((a) => ({ award: a })),
    remixedFrom: data.remixedFrom
      ? {
          id: data.remixedFrom.id,
          name: data.remixedFrom.name,
          creator: data.remixedFrom.creator,
        }
      : null,
  };
}

function toCompanionDataForConverter(data: CompanionFullData) {
  return {
    ...data.companion,
    creator: data.creator,
    source: data.source,
    companionAwards: data.awards.map((a) => ({ award: a })),
  };
}

export async function getRecentContent(
  limit: number = 20
): Promise<RecentContentItem[]> {
  return getRecentPublicContent(limit);
}

export async function getRecentPublicContent(
  limit: number = 25
): Promise<RecentContentItem[]> {
  const db = getDatabase();

  const [monsterRows, itemRows, companionRows, collectionRows, familyRows] =
    await Promise.all([
      db
        .select()
        .from(monsters)
        .where(eq(monsters.visibility, "public"))
        .orderBy(desc(monsters.createdAt))
        .limit(limit),
      db
        .select()
        .from(items)
        .where(eq(items.visibility, "public"))
        .orderBy(desc(items.createdAt))
        .limit(limit),
      db
        .select()
        .from(companions)
        .where(eq(companions.visibility, "public"))
        .orderBy(desc(companions.createdAt))
        .limit(limit),
      db
        .select()
        .from(collections)
        .innerJoin(users, eq(collections.creatorId, users.id))
        .where(eq(collections.visibility, "public"))
        .orderBy(desc(collections.createdAt))
        .limit(limit),
      db
        .select()
        .from(families)
        .innerJoin(users, eq(families.creatorId, users.id))
        .where(eq(families.visibility, "public"))
        .orderBy(desc(families.createdAt))
        .limit(limit),
    ]);

  const monsterIds = monsterRows.map((m) => m.id);
  const itemIds = itemRows.map((i) => i.id);
  const companionIds = companionRows.map((c) => c.id);
  const collectionIds = collectionRows.map((c) => c.collections.id);
  const familyIds = familyRows.map((f) => f.families.id);

  const [monstersFullData, itemsFullData, companionsFullData] =
    await Promise.all([
      loadMonstersFullData(db, monsterIds),
      loadItemsFullData(db, itemIds),
      loadCompanionsFullData(db, companionIds),
    ]);

  const [collectionMonstersRows, collectionItemsRows, familyMonstersRows] =
    await Promise.all([
      collectionIds.length > 0
        ? db
            .select()
            .from(monstersCollections)
            .innerJoin(monsters, eq(monstersCollections.monsterId, monsters.id))
            .where(inArray(monstersCollections.collectionId, collectionIds))
        : Promise.resolve([]),
      collectionIds.length > 0
        ? db
            .select()
            .from(itemsCollections)
            .innerJoin(items, eq(itemsCollections.itemId, items.id))
            .where(inArray(itemsCollections.collectionId, collectionIds))
        : Promise.resolve([]),
      familyIds.length > 0
        ? db
            .select()
            .from(monstersFamilies)
            .innerJoin(monsters, eq(monstersFamilies.monsterId, monsters.id))
            .where(inArray(monstersFamilies.familyId, familyIds))
        : Promise.resolve([]),
    ]);

  const monstersByCollection = new Map<string, MonsterRow[]>();
  for (const row of collectionMonstersRows) {
    if (row.monsters.visibility !== "public") continue;
    const existing =
      monstersByCollection.get(row.monsters_collections.collectionId) || [];
    existing.push(row.monsters);
    monstersByCollection.set(row.monsters_collections.collectionId, existing);
  }

  const itemsByCollection = new Map<string, ItemRow[]>();
  for (const row of collectionItemsRows) {
    const existing =
      itemsByCollection.get(row.items_collections.collectionId) || [];
    existing.push(row.items);
    itemsByCollection.set(row.items_collections.collectionId, existing);
  }

  const monsterIdsByFamily = new Map<string, string[]>();
  for (const row of familyMonstersRows) {
    if (row.monsters.visibility !== "public") continue;
    const existing =
      monsterIdsByFamily.get(row.monsters_families.familyId) || [];
    existing.push(row.monsters.id);
    monsterIdsByFamily.set(row.monsters_families.familyId, existing);
  }

  const allFamilyMonsterIds = [
    ...new Set(Array.from(monsterIdsByFamily.values()).flat()),
  ];
  const familyMonstersFullData = await loadMonstersFullData(
    db,
    allFamilyMonsterIds
  );

  const allItems: RecentContentItem[] = [
    ...monsterRows
      .map((m) => {
        const fullData = monstersFullData.get(m.id);
        if (!fullData) return null;
        return {
          type: "monster" as const,
          id: m.id,
          name: m.name,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          creator: toUser(fullData.creator),
          data: toMonster(toMonsterDataForConverter(fullData)),
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null),
    ...itemRows
      .map((i) => {
        const fullData = itemsFullData.get(i.id);
        if (!fullData) return null;
        return {
          type: "item" as const,
          id: i.id,
          name: i.name,
          createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
          creator: toUser(fullData.creator),
          data: toItem({
            ...fullData.item,
            creator: fullData.creator,
            source: fullData.source,
            itemAwards: fullData.awards.map((a) => ({ award: a })),
          }),
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null),
    ...companionRows
      .map((c) => {
        const fullData = companionsFullData.get(c.id);
        if (!fullData) return null;
        return {
          type: "companion" as const,
          id: c.id,
          name: c.name,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          creator: toUser(fullData.creator),
          data: toCompanion(toCompanionDataForConverter(fullData)),
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null),
    ...collectionRows
      .filter((c) => c.collections.createdAt !== null)
      .map((c) => {
        const collectionMonsters =
          monstersByCollection.get(c.collections.id) || [];
        const collectionItems = itemsByCollection.get(c.collections.id) || [];
        return {
          type: "collection" as const,
          id: c.collections.id,
          name: c.collections.name,
          createdAt: c.collections.createdAt
            ? new Date(c.collections.createdAt)
            : new Date(),
          creator: toUser(c.users),
          data: toCollectionOverview({
            id: c.collections.id,
            name: c.collections.name,
            description: c.collections.description,
            visibility: c.collections.visibility,
            createdAt: c.collections.createdAt,
            creator: c.users,
            monsterCollections: collectionMonsters.map((m) => ({
              monster: m,
            })),
            itemCollections: collectionItems.map((i) => ({
              item: i,
            })),
          }),
        };
      }),
    ...familyRows
      .filter((f) => {
        const familyMonsterIds = monsterIdsByFamily.get(f.families.id) || [];
        return familyMonsterIds.length > 0 && f.families.createdAt !== null;
      })
      .map((f) => {
        const familyMonsterIds = monsterIdsByFamily.get(f.families.id) || [];
        const familyOverview = toFamilyOverview({
          id: f.families.id,
          name: f.families.name,
          description: f.families.description,
          abilities: f.families.abilities,
          visibility: f.families.visibility,
          creatorId: f.families.creatorId,
          creator: f.users,
        });
        if (!familyOverview) {
          return null;
        }
        return {
          type: "family" as const,
          id: f.families.id,
          name: f.families.name,
          createdAt: f.families.createdAt
            ? new Date(f.families.createdAt)
            : new Date(),
          creator: toUser(f.users),
          data: {
            ...familyOverview,
            monsters: familyMonsterIds
              .map((id) => {
                const data = familyMonstersFullData.get(id);
                if (!data) return null;
                return toMonster(toMonsterDataForConverter(data));
              })
              .filter((m): m is NonNullable<typeof m> => m !== null),
          } as Family & { monsters: MonsterMini[] },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null),
  ];

  return allItems
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

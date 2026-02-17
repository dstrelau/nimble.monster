"use server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  like,
  lt,
  or,
} from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type AncestryRow,
  type AwardRow,
  ancestries,
  ancestriesCollections,
  awards,
  type BackgroundRow,
  backgrounds,
  backgroundsCollections,
  type CompanionRow,
  type ConditionRow,
  collections,
  companions,
  companionsCollections,
  conditions,
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
  monstersConditions,
  monstersFamilies,
  type SourceRow,
  type SpellSchoolRow,
  type SubclassRow,
  sources,
  spellSchools,
  spellSchoolsCollections,
  spells,
  subclasses,
  subclassesCollections,
  type UserRow,
  users,
} from "@/lib/db/schema";
import { findSpellSchoolsByIds } from "@/lib/db/school";
import { findSubclassesByIds } from "@/lib/db/subclass";
import { findAncestriesByIds } from "@/lib/services/ancestries/repository";
import type { AncestryMini } from "@/lib/services/ancestries/types";
import { findBackgroundsByIds } from "@/lib/services/backgrounds/repository";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";
import { findCompanionsByIds } from "@/lib/services/companions/repository";
import type {
  Ability,
  Action,
  Collection,
  CollectionOverview,
  CompanionMini,
  FamilyOverview,
  Source,
  SpellSchoolMini,
  SubclassMini,
  User,
} from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import type { Item, ItemMini, ItemRarity } from "../items/types";
import type { Monster, MonsterMini, MonsterRole } from "../monsters/types";

export type CollectionSortBy = "name" | "createdAt";
export type CollectionSortDirection = "asc" | "desc";

export interface SearchCollectionsParams {
  searchTerm?: string;
  sortBy: CollectionSortBy;
  sortDirection: CollectionSortDirection;
  limit: number;
  offset?: number;
}

export interface ListCollectionsParams {
  cursor?: string;
  limit?: number;
  sort?: "name" | "-name" | "createdAt" | "-createdAt";
}

// Helper converters
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

const toAbilitiesFromRow = (abilities: unknown): Ability[] => {
  return ((abilities as Omit<Ability, "id">[]) || []).map((ability) => ({
    ...ability,
    id: crypto.randomUUID(),
  }));
};

const toActionsFromRow = (actions: unknown): Action[] => {
  return ((actions as Omit<Action, "id">[]) || []).map((action) => ({
    ...action,
    id: crypto.randomUUID(),
  }));
};

const toMonsterMiniFromRow = (m: MonsterRow): MonsterMini => ({
  id: m.id,
  hp: m.hp,
  legendary: m.legendary || false,
  minion: m.minion,
  level: m.level,
  levelInt: m.levelInt,
  name: m.name,
  visibility: (m.visibility ?? "public") as "public" | "private",
  size: m.size,
  armor: m.armor === "" ? "none" : m.armor,
  paperforgeId: m.paperforgeId ?? undefined,
  createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
  role: m.role as MonsterRole | null,
});

const toItemMiniFromRow = (item: ItemRow): ItemMini => ({
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

const toCompanionMiniFromRow = (c: CompanionRow): CompanionMini => ({
  id: c.id,
  name: c.name,
  hp_per_level: c.hpPerLevel,
  wounds: c.wounds,
  visibility: (c.visibility ?? "public") as "public" | "private",
});

const toAncestryMiniFromRow = (a: AncestryRow): AncestryMini => {
  const sizes =
    typeof a.size === "string" && a.size
      ? a.size.includes(",")
        ? a.size.split(",")
        : [a.size]
      : [];
  return {
    id: a.id,
    name: a.name,
    size: sizes as AncestryMini["size"],
    rarity: (a.rarity ?? "common") as AncestryMini["rarity"],
    createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
  };
};

const toBackgroundMiniFromRow = (b: BackgroundRow): BackgroundMini => ({
  id: b.id,
  name: b.name,
  requirement: b.requirement ?? undefined,
  createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
  updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
});

const toSubclassMiniFromRow = (s: SubclassRow): SubclassMini => ({
  id: s.id,
  name: s.name,
  className: s.className as SubclassMini["className"],
  namePreface: s.namePreface ?? undefined,
  tagline: s.tagline ?? undefined,
  visibility: (s.visibility ?? "public") as SubclassMini["visibility"],
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

const toSpellSchoolMiniFromRow = (
  s: SpellSchoolRow,
  spellCount?: number
): SpellSchoolMini => ({
  id: s.id,
  name: s.name,
  visibility: (s.visibility ?? "public") as "public" | "private",
  spellCount,
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

async function loadCollectionEntityMinis(
  db: ReturnType<typeof getDatabase>,
  collectionIds: string[]
) {
  const [
    companionJoins,
    ancestryJoins,
    backgroundJoins,
    subclassJoins,
    schoolJoins,
  ] = await Promise.all([
    db
      .select({
        collectionId: companionsCollections.collectionId,
        companion: companions,
      })
      .from(companionsCollections)
      .innerJoin(
        companions,
        eq(companionsCollections.companionId, companions.id)
      )
      .where(
        and(
          inArray(companionsCollections.collectionId, collectionIds),
          eq(companions.visibility, "public")
        )
      ),
    db
      .select({
        collectionId: ancestriesCollections.collectionId,
        ancestry: ancestries,
      })
      .from(ancestriesCollections)
      .innerJoin(
        ancestries,
        eq(ancestriesCollections.ancestryId, ancestries.id)
      )
      .where(
        and(
          inArray(ancestriesCollections.collectionId, collectionIds),
          eq(ancestries.visibility, "public")
        )
      ),
    db
      .select({
        collectionId: backgroundsCollections.collectionId,
        background: backgrounds,
      })
      .from(backgroundsCollections)
      .innerJoin(
        backgrounds,
        eq(backgroundsCollections.backgroundId, backgrounds.id)
      )
      .where(
        and(
          inArray(backgroundsCollections.collectionId, collectionIds),
          eq(backgrounds.visibility, "public")
        )
      ),
    db
      .select({
        collectionId: subclassesCollections.collectionId,
        subclass: subclasses,
      })
      .from(subclassesCollections)
      .innerJoin(
        subclasses,
        eq(subclassesCollections.subclassId, subclasses.id)
      )
      .where(
        and(
          inArray(subclassesCollections.collectionId, collectionIds),
          eq(subclasses.visibility, "public")
        )
      ),
    db
      .select({
        collectionId: spellSchoolsCollections.collectionId,
        school: spellSchools,
      })
      .from(spellSchoolsCollections)
      .innerJoin(
        spellSchools,
        eq(spellSchoolsCollections.spellSchoolId, spellSchools.id)
      )
      .where(
        and(
          inArray(spellSchoolsCollections.collectionId, collectionIds),
          eq(spellSchools.visibility, "public")
        )
      ),
  ]);

  // Spell counts
  const schoolIds = [...new Set(schoolJoins.map((l) => l.school.id))];
  const spellCountMap = new Map<string, number>();
  if (schoolIds.length > 0) {
    const spellCounts = await db
      .select({ schoolId: spells.schoolId, count: count() })
      .from(spells)
      .where(inArray(spells.schoolId, schoolIds))
      .groupBy(spells.schoolId);
    for (const row of spellCounts) {
      spellCountMap.set(row.schoolId, row.count);
    }
  }

  // Group by collection
  const companionsByCollection = new Map<string, CompanionMini[]>();
  for (const row of companionJoins) {
    const existing = companionsByCollection.get(row.collectionId) || [];
    existing.push(toCompanionMiniFromRow(row.companion));
    companionsByCollection.set(row.collectionId, existing);
  }
  const ancestriesByCollection = new Map<string, AncestryMini[]>();
  for (const row of ancestryJoins) {
    const existing = ancestriesByCollection.get(row.collectionId) || [];
    existing.push(toAncestryMiniFromRow(row.ancestry));
    ancestriesByCollection.set(row.collectionId, existing);
  }
  const backgroundsByCollection = new Map<string, BackgroundMini[]>();
  for (const row of backgroundJoins) {
    const existing = backgroundsByCollection.get(row.collectionId) || [];
    existing.push(toBackgroundMiniFromRow(row.background));
    backgroundsByCollection.set(row.collectionId, existing);
  }
  const subclassesByCollection = new Map<string, SubclassMini[]>();
  for (const row of subclassJoins) {
    const existing = subclassesByCollection.get(row.collectionId) || [];
    existing.push(toSubclassMiniFromRow(row.subclass));
    subclassesByCollection.set(row.collectionId, existing);
  }
  const schoolsByCollection = new Map<string, SpellSchoolMini[]>();
  for (const row of schoolJoins) {
    const existing = schoolsByCollection.get(row.collectionId) || [];
    existing.push(
      toSpellSchoolMiniFromRow(row.school, spellCountMap.get(row.school.id))
    );
    schoolsByCollection.set(row.collectionId, existing);
  }

  return {
    companionsByCollection,
    ancestriesByCollection,
    backgroundsByCollection,
    subclassesByCollection,
    schoolsByCollection,
  };
}

// Full monster data for collection detail view
interface MonsterFullData {
  monster: MonsterRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
  families: Array<{ family: FamilyRow; creator: UserRow }>;
  conditions: Array<{ condition: ConditionRow; inline: boolean }>;
  remixedFrom: { id: string; name: string; creator: UserRow } | null;
}

const toMonsterFromFullData = (data: MonsterFullData): Monster => ({
  id: data.monster.id,
  hp: data.monster.hp,
  legendary: data.monster.legendary || false,
  minion: data.monster.minion,
  level: data.monster.level,
  levelInt: data.monster.levelInt,
  name: data.monster.name,
  visibility: (data.monster.visibility ?? "public") as "public" | "private",
  size: data.monster.size,
  armor: data.monster.armor === "" ? "none" : data.monster.armor,
  paperforgeId: data.monster.paperforgeId ?? undefined,
  createdAt: data.monster.createdAt
    ? new Date(data.monster.createdAt)
    : new Date(),
  kind: data.monster.kind,
  role: data.monster.role as MonsterRole | null,
  bloodied: data.monster.bloodied,
  lastStand: data.monster.lastStand,
  speed: data.monster.speed,
  fly: data.monster.fly,
  swim: data.monster.swim,
  climb: data.monster.climb,
  teleport: data.monster.teleport,
  burrow: data.monster.burrow,
  saves: data.monster.saves,
  updatedAt: data.monster.updatedAt
    ? new Date(data.monster.updatedAt)
    : new Date(),
  abilities: toAbilitiesFromRow(data.monster.abilities),
  actions: toActionsFromRow(data.monster.actions),
  actionPreface: data.monster.actionPreface || "",
  moreInfo: data.monster.moreInfo || "",
  families: data.families
    .map((f) => ({
      id: f.family.id,
      name: f.family.name,
      description: f.family.description ?? undefined,
      abilities: toAbilitiesFromRow(f.family.abilities),
      visibility: f.family.visibility ?? "public",
      creatorId: f.creator.discordId,
      creator: toUserFromRow(f.creator),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) as FamilyOverview[],
  creator: toUserFromRow(data.creator),
  source: toSourceFromRow(data.source),
  awards: data.awards.map(toAwardFromRow),
  remixedFromId: data.monster.remixedFromId || null,
  remixedFrom: data.remixedFrom
    ? {
        id: data.remixedFrom.id,
        name: data.remixedFrom.name,
        creator: toUserFromRow(data.remixedFrom.creator),
      }
    : null,
});

// Full item data for collection detail view
interface ItemFullData {
  item: ItemRow;
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

  const db = await getDatabase();

  // Build where conditions
  const whereConditions = [eq(collections.visibility, "public")];

  if (cursorData) {
    const op = isDesc ? lt : gt;
    if (sortField === "name") {
      const condition = or(
        op(collections.name, cursorData.value as string),
        and(
          eq(collections.name, cursorData.value as string),
          gt(collections.id, cursorData.id)
        )
      );
      if (condition) whereConditions.push(condition);
    } else if (sortField === "createdAt") {
      const condition = or(
        op(collections.createdAt, cursorData.value as string),
        and(
          eq(collections.createdAt, cursorData.value as string),
          gt(collections.id, cursorData.id)
        )
      );
      if (condition) whereConditions.push(condition);
    }
  }

  // Build order by
  const orderBy =
    sortField === "name"
      ? [
          isDesc ? desc(collections.name) : asc(collections.name),
          asc(collections.id),
        ]
      : [
          isDesc ? desc(collections.createdAt) : asc(collections.createdAt),
          asc(collections.id),
        ];

  // Query collections with creators
  const collectionRows = await db
    .select()
    .from(collections)
    .innerJoin(users, eq(collections.creatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(...orderBy)
    .limit(limit + 1);

  const collectionIds = collectionRows
    .slice(0, limit)
    .map((r) => r.collections.id);

  if (collectionIds.length === 0) {
    return { collections: [], nextCursor: null };
  }

  // Fetch public monsters in these collections
  const monsterJoins = await db
    .select({
      collectionId: monstersCollections.collectionId,
      monster: monsters,
    })
    .from(monstersCollections)
    .innerJoin(monsters, eq(monstersCollections.monsterId, monsters.id))
    .where(
      and(
        inArray(monstersCollections.collectionId, collectionIds),
        eq(monsters.visibility, "public")
      )
    );

  // Fetch public items in these collections
  const itemJoins = await db
    .select({
      collectionId: itemsCollections.collectionId,
      item: items,
    })
    .from(itemsCollections)
    .innerJoin(items, eq(itemsCollections.itemId, items.id))
    .where(
      and(
        inArray(itemsCollections.collectionId, collectionIds),
        eq(items.visibility, "public")
      )
    );

  // Load new entity types
  const entityMinis = await loadCollectionEntityMinis(db, collectionIds);

  // Group by collection
  const monstersByCollection = new Map<string, MonsterRow[]>();
  for (const row of monsterJoins) {
    const existing = monstersByCollection.get(row.collectionId) || [];
    existing.push(row.monster);
    monstersByCollection.set(row.collectionId, existing);
  }

  const itemsByCollection = new Map<string, ItemRow[]>();
  for (const row of itemJoins) {
    const existing = itemsByCollection.get(row.collectionId) || [];
    existing.push(row.item);
    itemsByCollection.set(row.collectionId, existing);
  }

  // Filter to collections that have content
  const filteredRows = collectionRows.filter((r) => {
    const cid = r.collections.id;
    return (
      (monstersByCollection.get(cid)?.length ?? 0) > 0 ||
      (itemsByCollection.get(cid)?.length ?? 0) > 0 ||
      (entityMinis.companionsByCollection.get(cid)?.length ?? 0) > 0 ||
      (entityMinis.ancestriesByCollection.get(cid)?.length ?? 0) > 0 ||
      (entityMinis.backgroundsByCollection.get(cid)?.length ?? 0) > 0 ||
      (entityMinis.subclassesByCollection.get(cid)?.length ?? 0) > 0 ||
      (entityMinis.schoolsByCollection.get(cid)?.length ?? 0) > 0
    );
  });

  const hasMore = filteredRows.length > limit;
  const resultRows = hasMore ? filteredRows.slice(0, limit) : filteredRows;

  // Build results
  const results: CollectionOverview[] = resultRows.map((row) => {
    const cid = row.collections.id;
    const collectionMonsters = monstersByCollection.get(cid) || [];
    const collectionItems = itemsByCollection.get(cid) || [];
    const legendaryCount = collectionMonsters.filter((m) => m.legendary).length;

    return {
      id: cid,
      creator: toUserFromRow(row.users),
      description: row.collections.description ?? undefined,
      legendaryCount,
      monsters: collectionMonsters
        .map(toMonsterMiniFromRow)
        .sort((a, b) => a.name.localeCompare(b.name)),
      name: row.collections.name,
      standardCount: collectionMonsters.length - legendaryCount,
      visibility:
        row.collections.visibility === "private" ? "private" : "public",
      createdAt: row.collections.createdAt
        ? new Date(row.collections.createdAt)
        : undefined,
      items: collectionItems
        .map(toItemMiniFromRow)
        .sort((a, b) => a.name.localeCompare(b.name)),
      itemCount: collectionItems.length,
      companions: entityMinis.companionsByCollection.get(cid) ?? [],
      ancestries: entityMinis.ancestriesByCollection.get(cid) ?? [],
      backgrounds: entityMinis.backgroundsByCollection.get(cid) ?? [],
      subclasses: entityMinis.subclassesByCollection.get(cid) ?? [],
      spellSchools: entityMinis.schoolsByCollection.get(cid) ?? [],
    };
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && resultRows.length > 0) {
    const lastRow = resultRows[resultRows.length - 1];
    const cursorData: CursorData = {
      sort: sort as "name" | "-name" | "createdAt" | "-createdAt",
      value:
        sortField === "name"
          ? lastRow.collections.name
          : (lastRow.collections.createdAt ?? new Date().toISOString()),
      id: lastRow.collections.id,
    };
    nextCursor = encodeCursor(cursorData);
  }

  return { collections: results, nextCursor };
};

export const searchPublicCollections = async ({
  searchTerm,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchCollectionsParams): Promise<CollectionOverview[]> => {
  const db = await getDatabase();

  // Build where conditions
  const whereConditions = [eq(collections.visibility, "public")];

  if (searchTerm) {
    const searchCondition = or(
      like(collections.name, `%${searchTerm}%`),
      like(collections.description, `%${searchTerm}%`)
    );
    if (searchCondition) whereConditions.push(searchCondition);
  }

  // Build order by
  const orderBy =
    sortBy === "name"
      ? sortDirection === "desc"
        ? desc(collections.name)
        : asc(collections.name)
      : sortDirection === "desc"
        ? desc(collections.createdAt)
        : asc(collections.createdAt);

  // Query collections with creators
  const collectionRows = await db
    .select()
    .from(collections)
    .innerJoin(users, eq(collections.creatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset ?? 0);

  const collectionIds = collectionRows.map((r) => r.collections.id);

  if (collectionIds.length === 0) {
    return [];
  }

  // Fetch public monsters in these collections
  const monsterJoins = await db
    .select({
      collectionId: monstersCollections.collectionId,
      monster: monsters,
    })
    .from(monstersCollections)
    .innerJoin(monsters, eq(monstersCollections.monsterId, monsters.id))
    .where(
      and(
        inArray(monstersCollections.collectionId, collectionIds),
        eq(monsters.visibility, "public")
      )
    );

  // Fetch public items in these collections
  const itemJoins = await db
    .select({
      collectionId: itemsCollections.collectionId,
      item: items,
    })
    .from(itemsCollections)
    .innerJoin(items, eq(itemsCollections.itemId, items.id))
    .where(
      and(
        inArray(itemsCollections.collectionId, collectionIds),
        eq(items.visibility, "public")
      )
    );

  // Load new entity types
  const entityMinis = await loadCollectionEntityMinis(db, collectionIds);

  // Group by collection
  const monstersByCollection = new Map<string, MonsterRow[]>();
  for (const row of monsterJoins) {
    const existing = monstersByCollection.get(row.collectionId) || [];
    existing.push(row.monster);
    monstersByCollection.set(row.collectionId, existing);
  }

  const itemsByCollection = new Map<string, ItemRow[]>();
  for (const row of itemJoins) {
    const existing = itemsByCollection.get(row.collectionId) || [];
    existing.push(row.item);
    itemsByCollection.set(row.collectionId, existing);
  }

  // Filter and map results
  return collectionRows
    .filter((r) => {
      const cid = r.collections.id;
      return (
        (monstersByCollection.get(cid)?.length ?? 0) > 0 ||
        (itemsByCollection.get(cid)?.length ?? 0) > 0 ||
        (entityMinis.companionsByCollection.get(cid)?.length ?? 0) > 0 ||
        (entityMinis.ancestriesByCollection.get(cid)?.length ?? 0) > 0 ||
        (entityMinis.backgroundsByCollection.get(cid)?.length ?? 0) > 0 ||
        (entityMinis.subclassesByCollection.get(cid)?.length ?? 0) > 0 ||
        (entityMinis.schoolsByCollection.get(cid)?.length ?? 0) > 0
      );
    })
    .map((row) => {
      const cid = row.collections.id;
      const collectionMonsters = monstersByCollection.get(cid) || [];
      const collectionItems = itemsByCollection.get(cid) || [];
      const legendaryCount = collectionMonsters.filter(
        (m) => m.legendary
      ).length;

      return {
        id: cid,
        creator: toUserFromRow(row.users),
        description: row.collections.description ?? undefined,
        legendaryCount,
        monsters: collectionMonsters
          .map(toMonsterMiniFromRow)
          .sort((a, b) => a.name.localeCompare(b.name)),
        name: row.collections.name,
        standardCount: collectionMonsters.length - legendaryCount,
        visibility:
          row.collections.visibility === "private" ? "private" : "public",
        createdAt: row.collections.createdAt
          ? new Date(row.collections.createdAt)
          : undefined,
        items: collectionItems
          .map(toItemMiniFromRow)
          .sort((a, b) => a.name.localeCompare(b.name)),
        itemCount: collectionItems.length,
        companions: entityMinis.companionsByCollection.get(cid) ?? [],
        ancestries: entityMinis.ancestriesByCollection.get(cid) ?? [],
        backgrounds: entityMinis.backgroundsByCollection.get(cid) ?? [],
        subclasses: entityMinis.subclassesByCollection.get(cid) ?? [],
        spellSchools: entityMinis.schoolsByCollection.get(cid) ?? [],
      };
    });
};

export const findPublicCollectionById = async (
  id: string
): Promise<Collection | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  // Get collection with creator
  const collectionResult = await db
    .select()
    .from(collections)
    .innerJoin(users, eq(collections.creatorId, users.id))
    .where(and(eq(collections.id, id), eq(collections.visibility, "public")))
    .limit(1);

  if (collectionResult.length === 0) return null;

  const collectionRow = collectionResult[0];

  // Get public monster IDs in this collection
  const monsterJoins = await db
    .select({ monsterId: monstersCollections.monsterId })
    .from(monstersCollections)
    .innerJoin(monsters, eq(monstersCollections.monsterId, monsters.id))
    .where(
      and(
        eq(monstersCollections.collectionId, id),
        eq(monsters.visibility, "public")
      )
    );

  const monsterIds = monsterJoins.map((r) => r.monsterId);

  // Get public item IDs in this collection
  const itemJoins = await db
    .select({ itemId: itemsCollections.itemId })
    .from(itemsCollections)
    .innerJoin(items, eq(itemsCollections.itemId, items.id))
    .where(
      and(eq(itemsCollections.collectionId, id), eq(items.visibility, "public"))
    );

  const itemIds = itemJoins.map((r) => r.itemId);

  // Load full monster data
  const monstersData: Monster[] = [];
  if (monsterIds.length > 0) {
    // Get base monster data
    const monsterRows = await db
      .select()
      .from(monsters)
      .innerJoin(users, eq(monsters.userId, users.id))
      .leftJoin(sources, eq(monsters.sourceId, sources.id))
      .where(inArray(monsters.id, monsterIds));

    // Get families
    const familyJoins = await db
      .select({
        monsterId: monstersFamilies.monsterId,
        family: families,
        creator: users,
      })
      .from(monstersFamilies)
      .innerJoin(families, eq(monstersFamilies.familyId, families.id))
      .innerJoin(users, eq(families.creatorId, users.id))
      .where(inArray(monstersFamilies.monsterId, monsterIds));

    const familiesByMonster = new Map<
      string,
      Array<{ family: FamilyRow; creator: UserRow }>
    >();
    for (const row of familyJoins) {
      const existing = familiesByMonster.get(row.monsterId) || [];
      existing.push({ family: row.family, creator: row.creator });
      familiesByMonster.set(row.monsterId, existing);
    }

    // Get conditions
    const conditionJoins = await db
      .select({
        monsterId: monstersConditions.monsterId,
        condition: conditions,
        inline: monstersConditions.inline,
      })
      .from(monstersConditions)
      .innerJoin(conditions, eq(monstersConditions.conditionId, conditions.id))
      .where(inArray(monstersConditions.monsterId, monsterIds));

    const conditionsByMonster = new Map<
      string,
      Array<{ condition: ConditionRow; inline: boolean }>
    >();
    for (const row of conditionJoins) {
      const existing = conditionsByMonster.get(row.monsterId) || [];
      existing.push({ condition: row.condition, inline: row.inline });
      conditionsByMonster.set(row.monsterId, existing);
    }

    // Get awards
    const awardJoins = await db
      .select({ monsterId: monstersAwards.monsterId, award: awards })
      .from(monstersAwards)
      .innerJoin(awards, eq(monstersAwards.awardId, awards.id))
      .where(inArray(monstersAwards.monsterId, monsterIds));

    const awardsByMonster = new Map<string, AwardRow[]>();
    for (const row of awardJoins) {
      const existing = awardsByMonster.get(row.monsterId) || [];
      existing.push(row.award);
      awardsByMonster.set(row.monsterId, existing);
    }

    // Get remixed from data
    const remixedFromIds = monsterRows
      .map((r) => r.monsters.remixedFromId)
      .filter((id): id is string => id !== null);

    const remixedFromMap = new Map<
      string,
      { id: string; name: string; creator: UserRow }
    >();
    if (remixedFromIds.length > 0) {
      const remixedFromRows = await db
        .select()
        .from(monsters)
        .innerJoin(users, eq(monsters.userId, users.id))
        .where(inArray(monsters.id, remixedFromIds));

      for (const row of remixedFromRows) {
        remixedFromMap.set(row.monsters.id, {
          id: row.monsters.id,
          name: row.monsters.name,
          creator: row.users,
        });
      }
    }

    // Convert to Monster objects
    for (const row of monsterRows) {
      const fullData: MonsterFullData = {
        monster: row.monsters,
        creator: row.users,
        source: row.sources,
        awards: awardsByMonster.get(row.monsters.id) || [],
        families: familiesByMonster.get(row.monsters.id) || [],
        conditions: conditionsByMonster.get(row.monsters.id) || [],
        remixedFrom: row.monsters.remixedFromId
          ? remixedFromMap.get(row.monsters.remixedFromId) || null
          : null,
      };
      monstersData.push(toMonsterFromFullData(fullData));
    }
  }

  // Load full item data
  const itemsData: Item[] = [];
  if (itemIds.length > 0) {
    const itemRows = await db
      .select()
      .from(items)
      .innerJoin(users, eq(items.userId, users.id))
      .leftJoin(sources, eq(items.sourceId, sources.id))
      .where(inArray(items.id, itemIds));

    // Get awards for items
    const itemAwardJoins = await db
      .select({ itemId: itemsAwards.itemId, award: awards })
      .from(itemsAwards)
      .innerJoin(awards, eq(itemsAwards.awardId, awards.id))
      .where(inArray(itemsAwards.itemId, itemIds));

    const awardsByItem = new Map<string, AwardRow[]>();
    for (const row of itemAwardJoins) {
      const existing = awardsByItem.get(row.itemId) || [];
      existing.push(row.award);
      awardsByItem.set(row.itemId, existing);
    }

    for (const row of itemRows) {
      const fullData: ItemFullData = {
        item: row.items,
        creator: row.users,
        source: row.sources,
        awards: awardsByItem.get(row.items.id) || [],
      };
      itemsData.push(toItemFromFullData(fullData));
    }
  }

  // Load new entity IDs
  const [
    companionJoins,
    ancestryJoins,
    backgroundJoins,
    subclassJoins,
    schoolJoins,
  ] = await Promise.all([
    db
      .select({ companionId: companionsCollections.companionId })
      .from(companionsCollections)
      .innerJoin(
        companions,
        eq(companionsCollections.companionId, companions.id)
      )
      .where(
        and(
          eq(companionsCollections.collectionId, id),
          eq(companions.visibility, "public")
        )
      ),
    db
      .select({ ancestryId: ancestriesCollections.ancestryId })
      .from(ancestriesCollections)
      .innerJoin(
        ancestries,
        eq(ancestriesCollections.ancestryId, ancestries.id)
      )
      .where(
        and(
          eq(ancestriesCollections.collectionId, id),
          eq(ancestries.visibility, "public")
        )
      ),
    db
      .select({ backgroundId: backgroundsCollections.backgroundId })
      .from(backgroundsCollections)
      .innerJoin(
        backgrounds,
        eq(backgroundsCollections.backgroundId, backgrounds.id)
      )
      .where(
        and(
          eq(backgroundsCollections.collectionId, id),
          eq(backgrounds.visibility, "public")
        )
      ),
    db
      .select({ subclassId: subclassesCollections.subclassId })
      .from(subclassesCollections)
      .innerJoin(
        subclasses,
        eq(subclassesCollections.subclassId, subclasses.id)
      )
      .where(
        and(
          eq(subclassesCollections.collectionId, id),
          eq(subclasses.visibility, "public")
        )
      ),
    db
      .select({ schoolId: spellSchoolsCollections.spellSchoolId })
      .from(spellSchoolsCollections)
      .innerJoin(
        spellSchools,
        eq(spellSchoolsCollections.spellSchoolId, spellSchools.id)
      )
      .where(
        and(
          eq(spellSchoolsCollections.collectionId, id),
          eq(spellSchools.visibility, "public")
        )
      ),
  ]);

  const [
    companionsData,
    ancestriesData,
    backgroundsData,
    subclassesData,
    schoolsData,
  ] = await Promise.all([
    findCompanionsByIds(companionJoins.map((r) => r.companionId)),
    findAncestriesByIds(ancestryJoins.map((r) => r.ancestryId)),
    findBackgroundsByIds(backgroundJoins.map((r) => r.backgroundId)),
    findSubclassesByIds(subclassJoins.map((r) => r.subclassId)),
    findSpellSchoolsByIds(schoolJoins.map((r) => r.schoolId)),
  ]);

  const legendaryCount = monstersData.filter((m) => m.legendary).length;

  return {
    id: collectionRow.collections.id,
    name: collectionRow.collections.name,
    description: collectionRow.collections.description ?? undefined,
    visibility:
      collectionRow.collections.visibility === "private" ? "private" : "public",
    createdAt: collectionRow.collections.createdAt
      ? new Date(collectionRow.collections.createdAt)
      : undefined,
    legendaryCount,
    standardCount: monstersData.length - legendaryCount,
    creator: toUserFromRow(collectionRow.users),
    monsters: monstersData.sort((a, b) => a.name.localeCompare(b.name)),
    items: itemsData.sort((a, b) => a.name.localeCompare(b.name)),
    itemCount: itemsData.length,
    companions: companionsData,
    ancestries: ancestriesData,
    backgrounds: backgroundsData,
    subclasses: subclassesData,
    spellSchools: schoolsData,
  };
};

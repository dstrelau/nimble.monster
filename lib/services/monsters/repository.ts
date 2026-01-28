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
  type AwardRow,
  awards,
  type ConditionRow,
  collections,
  conditions,
  type FamilyRow,
  families,
  type MonsterRow,
  monsters,
  monstersAwards,
  monstersCollections,
  monstersConditions,
  monstersFamilies,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "@/lib/db/schema";
import type { Ability, Action, Source, User } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import { extractAllConditions, syncMonsterConditions } from "./conditions";
import { syncMonsterFamilies } from "./families";
import type { PaginateMonstersParams } from "./service";
import type {
  CreateMonsterInput,
  Monster,
  MonsterMini,
  MonsterRole,
  SearchMonstersParams,
  UpdateMonsterInput,
} from "./types";

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

const parseJsonField = <T>(value: unknown): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

const toAbilitiesFromRow = (abilities: unknown): Ability[] => {
  return parseJsonField<Omit<Ability, "id">>(abilities).map((ability) => ({
    ...ability,
    id: crypto.randomUUID(),
  }));
};

const toActionsFromRow = (actions: unknown): Action[] => {
  return parseJsonField<Omit<Action, "id">>(actions).map((action) => ({
    ...action,
    id: crypto.randomUUID(),
  }));
};

const stripActionIds = (actions: Action[]): Omit<Action, "id">[] =>
  actions.map(({ id, ...action }) => action);

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

// Full monster data loader
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
      creatorId: f.creator.discordId ?? "",
      creator: toUserFromRow(f.creator),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
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

async function loadMonsterFullData(
  db: Awaited<ReturnType<typeof getDatabase>>,
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

  const conditionRows = await db
    .select({
      monsterId: monstersConditions.monsterId,
      condition: conditions,
      inline: monstersConditions.inline,
    })
    .from(monstersConditions)
    .innerJoin(conditions, eq(monstersConditions.conditionId, conditions.id))
    .where(inArray(monstersConditions.monsterId, monsterIds));

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

  const conditionsByMonster = new Map<
    string,
    Array<{ condition: ConditionRow; inline: boolean }>
  >();
  for (const row of conditionRows) {
    const existing = conditionsByMonster.get(row.monsterId) || [];
    existing.push({ condition: row.condition, inline: row.inline });
    conditionsByMonster.set(row.monsterId, existing);
  }

  const result = new Map<string, MonsterFullData>();
  for (const row of monsterRows) {
    result.set(row.monsters.id, {
      monster: row.monsters,
      creator: row.users,
      source: row.sources,
      awards: awardsByMonster.get(row.monsters.id) || [],
      families: familiesByMonster.get(row.monsters.id) || [],
      conditions: conditionsByMonster.get(row.monsters.id) || [],
      remixedFrom: row.monsters.remixedFromId
        ? remixedFromMap.get(row.monsters.remixedFromId) || null
        : null,
    });
  }

  return result;
}

// ===== Exported functions =====

export const deleteMonster = async (
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

  const result = await db
    .delete(monsters)
    .where(and(eq(monsters.id, id), eq(monsters.userId, user.id)));

  return result.rowsAffected > 0;
};

export const listPublicMonsterMinis = async (): Promise<MonsterMini[]> => {
  const db = await getDatabase();

  const monsterRows = await db
    .select()
    .from(monsters)
    .where(eq(monsters.visibility, "public"))
    .orderBy(asc(monsters.name));

  return monsterRows.map(toMonsterMiniFromRow);
};

export const paginateMonsters = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  type = "all",
  creatorId,
  sourceId,
  role,
  level,
  includePrivate = false,
}: PaginateMonstersParams & { includePrivate?: boolean }): Promise<{
  data: Monster[];
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
    whereConditions.push(eq(monsters.visibility, "public"));
  }

  if (creatorId) {
    whereConditions.push(eq(monsters.userId, creatorId));
  }

  if (sourceId) {
    whereConditions.push(eq(monsters.sourceId, sourceId));
  }

  if (role) {
    whereConditions.push(eq(monsters.role, role));
  }

  if (level !== undefined) {
    whereConditions.push(eq(monsters.levelInt, level));
  }

  if (type === "legendary") {
    whereConditions.push(eq(monsters.legendary, true));
  } else if (type === "minion") {
    whereConditions.push(eq(monsters.minion, true));
  } else if (type === "standard") {
    whereConditions.push(eq(monsters.minion, false));
    whereConditions.push(eq(monsters.legendary, false));
  }

  // Build the query
  let query = db.select({ id: monsters.id }).from(monsters).$dynamic();

  // Add search condition
  if (search) {
    const searchCondition = or(
      like(monsters.name, `%${search}%`),
      like(monsters.kind, `%${search}%`)
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
    const cursorCondition = buildCursorCondition(sortField, isDesc, cursorData);
    if (cursorCondition) {
      // Re-build with cursor condition
      const baseConditions = search
        ? [
            ...whereConditions,
            or(
              like(monsters.name, `%${search}%`),
              like(monsters.kind, `%${search}%`)
            ),
          ]
        : whereConditions;

      if (baseConditions.length > 0) {
        query = db
          .select({ id: monsters.id })
          .from(monsters)
          .where(and(...baseConditions, cursorCondition))
          .$dynamic();
      } else {
        query = db
          .select({ id: monsters.id })
          .from(monsters)
          .where(cursorCondition)
          .$dynamic();
      }
    }
  }

  // Add ordering
  if (sortField === "name") {
    query = query.orderBy(
      isDesc ? desc(monsters.name) : asc(monsters.name),
      asc(monsters.id)
    );
  } else if (sortField === "createdAt") {
    query = query.orderBy(
      isDesc ? desc(monsters.createdAt) : asc(monsters.createdAt),
      asc(monsters.id)
    );
  } else {
    query = query.orderBy(
      isDesc ? desc(monsters.levelInt) : asc(monsters.levelInt),
      asc(monsters.id)
    );
  }

  // Execute with limit + 1 to check for more
  const monsterIdRows = await query.limit(limit + 1);

  const hasMore = monsterIdRows.length > limit;
  const resultIds = hasMore
    ? monsterIdRows.slice(0, limit).map((r) => r.id)
    : monsterIdRows.map((r) => r.id);

  // Load full data for result IDs
  const monsterDataMap = await loadMonsterFullData(db, resultIds);

  // Convert to Monster array maintaining order
  const results = resultIds
    .map((id) => monsterDataMap.get(id))
    .filter((m): m is MonsterFullData => m !== undefined)
    .map(toMonsterFromFullData);

  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastId = resultIds[resultIds.length - 1];
    const lastMonsterData = monsterDataMap.get(lastId);
    if (lastMonsterData) {
      const lastRow = lastMonsterData.monster;
      let newCursorData: CursorData;

      if (sortField === "name") {
        newCursorData = {
          sort: sort as "name" | "-name",
          value: lastRow.name,
          id: lastRow.id,
        };
      } else if (sortField === "createdAt") {
        newCursorData = {
          sort: sort as "createdAt" | "-createdAt",
          value: lastRow.createdAt ?? "",
          id: lastRow.id,
        };
      } else {
        newCursorData = {
          sort: sort as "level" | "-level",
          value: lastRow.levelInt,
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

function buildCursorCondition(
  sortField: string,
  isDesc: boolean,
  cursorData: CursorData
) {
  if (sortField === "name") {
    const cursorValue = cursorData.value as string;
    if (isDesc) {
      return or(
        lt(monsters.name, cursorValue),
        and(eq(monsters.name, cursorValue), gt(monsters.id, cursorData.id))
      );
    }
    return or(
      gt(monsters.name, cursorValue),
      and(eq(monsters.name, cursorValue), gt(monsters.id, cursorData.id))
    );
  }

  if (sortField === "createdAt") {
    const cursorValue = cursorData.value as string;
    if (isDesc) {
      return or(
        lt(monsters.createdAt, cursorValue),
        and(eq(monsters.createdAt, cursorValue), gt(monsters.id, cursorData.id))
      );
    }
    return or(
      gt(monsters.createdAt, cursorValue),
      and(eq(monsters.createdAt, cursorValue), gt(monsters.id, cursorData.id))
    );
  }

  if (sortField === "level") {
    const cursorValue = cursorData.value as number;
    if (isDesc) {
      return or(
        lt(monsters.levelInt, cursorValue),
        and(eq(monsters.levelInt, cursorValue), gt(monsters.id, cursorData.id))
      );
    }
    return or(
      gt(monsters.levelInt, cursorValue),
      and(eq(monsters.levelInt, cursorValue), gt(monsters.id, cursorData.id))
    );
  }

  return undefined;
}

export const findMonster = async (id: string): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  const monsterDataMap = await loadMonsterFullData(db, [id]);
  const data = monsterDataMap.get(id);

  return data ? toMonsterFromFullData(data) : null;
};

export const findMonstersByIds = async (ids: string[]): Promise<Monster[]> => {
  const validIds = ids.filter(isValidUUID);
  if (validIds.length === 0) return [];

  const db = await getDatabase();
  const monsterDataMap = await loadMonsterFullData(db, validIds);

  return validIds
    .map((id) => monsterDataMap.get(id))
    .filter((m): m is MonsterFullData => m !== undefined)
    .map(toMonsterFromFullData);
};

export const findPublicMonsterById = async (
  id: string
): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  // First check if monster exists and is public
  const monsterCheck = await db
    .select({ id: monsters.id })
    .from(monsters)
    .where(and(eq(monsters.id, id), eq(monsters.visibility, "public")))
    .limit(1);

  if (monsterCheck.length === 0) return null;

  const monsterDataMap = await loadMonsterFullData(db, [id]);
  const data = monsterDataMap.get(id);

  return data ? toMonsterFromFullData(data) : null;
};

export const findMonsterWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  // First check if monster exists and belongs to creator
  const monsterCheck = await db
    .select({ id: monsters.id })
    .from(monsters)
    .where(and(eq(monsters.id, id), eq(monsters.userId, creatorId)))
    .limit(1);

  if (monsterCheck.length === 0) return null;

  const monsterDataMap = await loadMonsterFullData(db, [id]);
  const data = monsterDataMap.get(id);

  return data ? toMonsterFromFullData(data) : null;
};

export const countPublicMonstersForUser = async (
  userId: string
): Promise<number> => {
  const db = await getDatabase();

  const result = await db
    .select({ count: count() })
    .from(monsters)
    .where(and(eq(monsters.userId, userId), eq(monsters.visibility, "public")));

  return result[0]?.count || 0;
};

export const listPublicMonstersForUser = async (
  userId: string
): Promise<Monster[]> => {
  const db = await getDatabase();

  const monsterIdRows = await db
    .select({ id: monsters.id })
    .from(monsters)
    .where(and(eq(monsters.userId, userId), eq(monsters.visibility, "public")))
    .orderBy(asc(monsters.name));

  if (monsterIdRows.length === 0) return [];

  const monsterIds = monsterIdRows.map((r) => r.id);
  const monsterDataMap = await loadMonsterFullData(db, monsterIds);

  return monsterIds
    .map((id) => monsterDataMap.get(id))
    .filter((m): m is MonsterFullData => m !== undefined)
    .map(toMonsterFromFullData);
};

export const listAllMonstersForDiscordID = async (
  discordId: string
): Promise<Monster[]> => {
  const db = await getDatabase();

  // Get user by discordId
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  const monsterIdRows = await db
    .select({ id: monsters.id })
    .from(monsters)
    .where(eq(monsters.userId, user.id))
    .orderBy(asc(monsters.name));

  if (monsterIdRows.length === 0) return [];

  const monsterIds = monsterIdRows.map((r) => r.id);
  const monsterDataMap = await loadMonsterFullData(db, monsterIds);

  return monsterIds
    .map((id) => monsterDataMap.get(id))
    .filter((m): m is MonsterFullData => m !== undefined)
    .map(toMonsterFromFullData);
};

export const searchPublicMonsterMinis = async ({
  searchTerm,
  type,
  creatorId,
  sortBy = "name",
  sortDirection = "asc",
  limit: maxLimit = 500,
}: SearchMonstersParams): Promise<MonsterMini[]> => {
  const db = await getDatabase();

  const whereConditions: ReturnType<typeof eq>[] = [
    eq(monsters.visibility, "public"),
  ];

  if (creatorId) {
    // Get user by discordId
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.discordId, creatorId))
      .limit(1);

    if (userResult.length > 0) {
      whereConditions.push(eq(monsters.userId, userResult[0].id));
    }
  }

  if (type === "standard") {
    whereConditions.push(eq(monsters.legendary, false));
    whereConditions.push(eq(monsters.minion, false));
  } else if (type === "legendary") {
    whereConditions.push(eq(monsters.legendary, true));
  } else if (type === "minion") {
    whereConditions.push(eq(monsters.minion, true));
  }

  let query = db.select().from(monsters).$dynamic();

  if (searchTerm) {
    const searchCondition = or(
      like(monsters.name, `%${searchTerm}%`),
      like(monsters.kind, `%${searchTerm}%`)
    );
    query = query.where(and(...whereConditions, searchCondition));
  } else {
    query = query.where(and(...whereConditions));
  }

  // Add ordering
  if (sortBy === "name") {
    query = query.orderBy(
      sortDirection === "desc" ? desc(monsters.name) : asc(monsters.name)
    );
  } else if (sortBy === "level") {
    query = query.orderBy(
      sortDirection === "desc"
        ? desc(monsters.levelInt)
        : asc(monsters.levelInt)
    );
  } else if (sortBy === "hp") {
    query = query.orderBy(
      sortDirection === "desc" ? desc(monsters.hp) : asc(monsters.hp)
    );
  }

  const monsterRows = await query.limit(maxLimit);

  return monsterRows.map(toMonsterMiniFromRow);
};

export const listMonstersByFamilyId = async (
  familyId: string
): Promise<Monster[]> => {
  const db = await getDatabase();

  // Get monster IDs in this family that are public
  const monsterIdRows = await db
    .select({ monsterId: monstersFamilies.monsterId })
    .from(monstersFamilies)
    .innerJoin(monsters, eq(monstersFamilies.monsterId, monsters.id))
    .where(
      and(
        eq(monstersFamilies.familyId, familyId),
        eq(monsters.visibility, "public")
      )
    );

  if (monsterIdRows.length === 0) return [];

  const monsterIds = monsterIdRows.map((r) => r.monsterId);
  const monsterDataMap = await loadMonsterFullData(db, monsterIds);

  return monsterIds
    .map((id) => monsterDataMap.get(id))
    .filter((m): m is MonsterFullData => m !== undefined)
    .map(toMonsterFromFullData)
    .sort((a, b) => a.levelInt - b.levelInt);
};

export const findMonsterCollections = async (monsterId: string) => {
  if (!isValidUUID(monsterId)) return [];

  const db = await getDatabase();

  // Get collection IDs that contain this monster
  const collectionLinks = await db
    .select({ collectionId: monstersCollections.collectionId })
    .from(monstersCollections)
    .where(eq(monstersCollections.monsterId, monsterId));

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

export const findMonsterRemixes = async (monsterId: string) => {
  if (!isValidUUID(monsterId)) return [];

  const db = await getDatabase();

  const remixRows = await db
    .select()
    .from(monsters)
    .innerJoin(users, eq(monsters.userId, users.id))
    .where(
      and(
        eq(monsters.remixedFromId, monsterId),
        eq(monsters.visibility, "public")
      )
    )
    .orderBy(asc(monsters.name));

  return remixRows.map((row) => ({
    id: row.monsters.id,
    name: row.monsters.name,
    creator: toUserFromRow(row.users),
  }));
};

export const createMonster = async (
  input: CreateMonsterInput,
  discordId: string
): Promise<Monster> => {
  const db = await getDatabase();

  const {
    name,
    kind = "",
    level,
    levelInt,
    hp,
    armor,
    size,
    speed,
    fly,
    swim,
    climb,
    burrow,
    teleport,
    families: familyInputs = [],
    actions,
    abilities,
    actionPreface = "",
    moreInfo = "",
    visibility,
    legendary = false,
    minion = false,
    bloodied = "",
    lastStand = "",
    saves = [],
    sourceId,
    role,
    paperforgeId,
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

  const savesString = legendary
    ? Array.isArray(saves)
      ? saves.join(" ")
      : saves || ""
    : "";

  const armorValue = armor === "none" || armor === "" ? "" : armor;

  // Insert the monster
  const monsterId = crypto.randomUUID();
  await db.insert(monsters).values({
    id: monsterId,
    name,
    kind,
    level,
    levelInt,
    hp,
    armor: armorValue,
    size,
    speed: legendary ? 0 : speed,
    fly: legendary ? 0 : fly,
    swim: legendary ? 0 : swim,
    climb: legendary ? 0 : climb,
    burrow: legendary ? 0 : burrow,
    teleport: legendary ? 0 : teleport,
    actions: JSON.stringify(stripActionIds(actions)),
    abilities: JSON.stringify(abilities),
    bloodied: legendary ? bloodied : "",
    lastStand: legendary ? lastStand : "",
    saves: savesString,
    visibility,
    actionPreface,
    moreInfo,
    legendary,
    minion,
    role,
    paperforgeId,
    userId: user.id,
    sourceId: sourceId || null,
    remixedFromId: remixedFromId || null,
  });

  // Sync conditions
  const conditionNames = extractAllConditions({
    actions,
    abilities,
    bloodied: legendary ? bloodied : "",
    lastStand: legendary ? lastStand : "",
    moreInfo,
  });

  await syncMonsterConditions(monsterId, conditionNames);
  await syncMonsterFamilies(
    monsterId,
    familyInputs.map((f) => f.id)
  );

  // Load and return the created monster
  const monsterDataMap = await loadMonsterFullData(db, [monsterId]);
  const data = monsterDataMap.get(monsterId);

  if (!data) {
    throw new Error("Failed to create monster");
  }

  return toMonsterFromFullData(data);
};

export const updateMonster = async (
  input: UpdateMonsterInput,
  discordId: string
): Promise<Monster> => {
  const db = await getDatabase();

  const {
    id,
    name,
    level,
    levelInt,
    hp,
    armor,
    size,
    speed,
    fly,
    swim,
    climb,
    teleport,
    burrow,
    actions,
    abilities,
    legendary,
    minion,
    bloodied,
    lastStand,
    saves,
    kind,
    visibility,
    actionPreface,
    moreInfo,
    families: familyInputs = [],
    sourceId,
    role,
    paperforgeId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid monster ID");
  }

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

  // Verify monster exists and belongs to user
  const existingMonster = await db
    .select()
    .from(monsters)
    .where(and(eq(monsters.id, id), eq(monsters.userId, user.id)))
    .limit(1);

  if (existingMonster.length === 0) {
    throw new Error("Monster not found");
  }

  const armorValue = armor === "none" || !armor ? "" : armor;

  // Update the monster
  await db
    .update(monsters)
    .set({
      name,
      level,
      levelInt,
      hp,
      armor: armorValue,
      size,
      speed,
      fly,
      swim,
      climb,
      teleport,
      burrow,
      actions: JSON.stringify(stripActionIds(actions)),
      abilities: JSON.stringify(abilities),
      legendary,
      minion,
      bloodied,
      lastStand,
      saves: Array.isArray(saves) ? saves.join(" ") : saves || "",
      kind,
      visibility,
      actionPreface,
      moreInfo,
      role,
      paperforgeId,
      sourceId: sourceId ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(monsters.id, id));

  // Sync conditions
  const conditionNames = extractAllConditions({
    actions: actions || [],
    abilities: abilities || [],
    bloodied: bloodied || "",
    lastStand: lastStand || "",
    moreInfo: moreInfo || "",
  });

  await syncMonsterConditions(id, conditionNames);
  await syncMonsterFamilies(
    id,
    familyInputs.map((f) => f.id)
  );

  // Load and return the updated monster
  const monsterDataMap = await loadMonsterFullData(db, [id]);
  const data = monsterDataMap.get(id);

  if (!data) {
    throw new Error("Failed to update monster");
  }

  return toMonsterFromFullData(data);
};

export const listAllSources = async (): Promise<Source[]> => {
  const db = await getDatabase();

  const sourceRows = await db.select().from(sources).orderBy(asc(sources.name));

  return sourceRows.map((s) => ({
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  }));
};

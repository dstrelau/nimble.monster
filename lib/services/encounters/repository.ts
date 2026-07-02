"use server";
import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  encounters,
  type MonsterRow,
  monsters,
  monstersEncounters,
  users,
} from "@/lib/db/schema";
import { toMonsterMini } from "@/lib/services/monsters/converters";
import type {
  EncounterMonsterEntry,
  EncounterOverview,
  User,
} from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";

export type EncounterSortBy = "name" | "createdAt";
export type EncounterSortDirection = "asc" | "desc";

export interface SearchEncountersParams {
  searchTerm?: string;
  sortBy: EncounterSortBy;
  sortDirection: EncounterSortDirection;
  limit: number;
  offset?: number;
}

export interface ListEncountersParams {
  cursor?: string;
  limit?: number;
  sort?: "name" | "-name" | "createdAt" | "-createdAt";
}

const toUserFromRow = (u: typeof users.$inferSelect): User => ({
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

interface MonsterEncounterJoinRow {
  monster: MonsterRow;
  quantity: number;
  isPerHero: boolean;
}

const toEncounterMonsterEntries = (
  rows: MonsterEncounterJoinRow[]
): EncounterMonsterEntry[] =>
  rows
    .map((row) => ({
      monster: toMonsterMini(row.monster),
      quantity: row.quantity,
      isPerHero: row.isPerHero,
    }))
    .sort((a, b) => a.monster.name.localeCompare(b.monster.name));

export const listPublicEncounters = async ({
  cursor,
  limit = 100,
  sort = "name",
}: ListEncountersParams): Promise<{
  encounters: EncounterOverview[];
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

  const whereConditions = [eq(encounters.visibility, "public")];

  if (cursorData) {
    const op = isDesc ? lt : gt;
    if (sortField === "name") {
      const condition = or(
        op(encounters.name, cursorData.value as string),
        and(
          eq(encounters.name, cursorData.value as string),
          gt(encounters.id, cursorData.id)
        )
      );
      if (condition) whereConditions.push(condition);
    } else if (sortField === "createdAt") {
      const condition = or(
        op(encounters.createdAt, cursorData.value as string),
        and(
          eq(encounters.createdAt, cursorData.value as string),
          gt(encounters.id, cursorData.id)
        )
      );
      if (condition) whereConditions.push(condition);
    }
  }

  const orderBy =
    sortField === "name"
      ? [
          isDesc ? desc(encounters.name) : asc(encounters.name),
          asc(encounters.id),
        ]
      : [
          isDesc ? desc(encounters.createdAt) : asc(encounters.createdAt),
          asc(encounters.id),
        ];

  const encounterRows = await db
    .select()
    .from(encounters)
    .innerJoin(users, eq(encounters.creatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasMore = encounterRows.length > limit;
  const resultRows = hasMore ? encounterRows.slice(0, limit) : encounterRows;
  const encounterIds = resultRows.map((r) => r.encounters.id);

  if (encounterIds.length === 0) {
    return { encounters: [], nextCursor: null };
  }

  const monsterJoins = await db
    .select({
      encounterId: monstersEncounters.encounterId,
      monster: monsters,
      quantity: monstersEncounters.quantity,
      isPerHero: monstersEncounters.isPerHero,
    })
    .from(monstersEncounters)
    .innerJoin(monsters, eq(monstersEncounters.monsterId, monsters.id))
    .where(
      and(
        inArray(monstersEncounters.encounterId, encounterIds),
        eq(monsters.visibility, "public")
      )
    );

  const monstersByEncounter = new Map<string, MonsterEncounterJoinRow[]>();
  for (const row of monsterJoins) {
    const existing = monstersByEncounter.get(row.encounterId) || [];
    existing.push({
      monster: row.monster,
      quantity: row.quantity,
      isPerHero: row.isPerHero,
    });
    monstersByEncounter.set(row.encounterId, existing);
  }

  const results: EncounterOverview[] = resultRows.map((row) => ({
    id: row.encounters.id,
    name: row.encounters.name,
    description: row.encounters.description ?? undefined,
    visibility: row.encounters.visibility === "private" ? "private" : "public",
    heroCount: row.encounters.heroCount,
    heroLevel: row.encounters.heroLevel,
    creator: toUserFromRow(row.users),
    monsters: toEncounterMonsterEntries(
      monstersByEncounter.get(row.encounters.id) ?? []
    ),
    createdAt: row.encounters.createdAt
      ? new Date(row.encounters.createdAt)
      : undefined,
  }));

  let nextCursor: string | null = null;
  if (hasMore && resultRows.length > 0) {
    const lastRow = resultRows[resultRows.length - 1];
    const cursorData: CursorData = {
      sort: sort as "name" | "-name" | "createdAt" | "-createdAt",
      value:
        sortField === "name"
          ? lastRow.encounters.name
          : (lastRow.encounters.createdAt ?? new Date().toISOString()),
      id: lastRow.encounters.id,
    };
    nextCursor = encodeCursor(cursorData);
  }

  return { encounters: results, nextCursor };
};

export const searchPublicEncounters = async ({
  searchTerm,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchEncountersParams): Promise<EncounterOverview[]> => {
  const db = await getDatabase();

  const whereConditions = [eq(encounters.visibility, "public")];

  if (searchTerm) {
    const searchCondition = or(
      like(encounters.name, `%${searchTerm}%`),
      like(encounters.description, `%${searchTerm}%`)
    );
    if (searchCondition) whereConditions.push(searchCondition);
  }

  const orderBy =
    sortBy === "name"
      ? sortDirection === "desc"
        ? desc(encounters.name)
        : asc(encounters.name)
      : sortDirection === "desc"
        ? desc(encounters.createdAt)
        : asc(encounters.createdAt);

  const encounterRows = await db
    .select()
    .from(encounters)
    .innerJoin(users, eq(encounters.creatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset ?? 0);

  const encounterIds = encounterRows.map((r) => r.encounters.id);

  if (encounterIds.length === 0) {
    return [];
  }

  const monsterJoins = await db
    .select({
      encounterId: monstersEncounters.encounterId,
      monster: monsters,
      quantity: monstersEncounters.quantity,
      isPerHero: monstersEncounters.isPerHero,
    })
    .from(monstersEncounters)
    .innerJoin(monsters, eq(monstersEncounters.monsterId, monsters.id))
    .where(
      and(
        inArray(monstersEncounters.encounterId, encounterIds),
        eq(monsters.visibility, "public")
      )
    );

  const monstersByEncounter = new Map<string, MonsterEncounterJoinRow[]>();
  for (const row of monsterJoins) {
    const existing = monstersByEncounter.get(row.encounterId) || [];
    existing.push({
      monster: row.monster,
      quantity: row.quantity,
      isPerHero: row.isPerHero,
    });
    monstersByEncounter.set(row.encounterId, existing);
  }

  return encounterRows.map((row) => ({
    id: row.encounters.id,
    name: row.encounters.name,
    description: row.encounters.description ?? undefined,
    visibility: row.encounters.visibility === "private" ? "private" : "public",
    heroCount: row.encounters.heroCount,
    heroLevel: row.encounters.heroLevel,
    creator: toUserFromRow(row.users),
    monsters: toEncounterMonsterEntries(
      monstersByEncounter.get(row.encounters.id) ?? []
    ),
    createdAt: row.encounters.createdAt
      ? new Date(row.encounters.createdAt)
      : undefined,
  }));
};

export const findPublicEncounterById = async (
  id: string
): Promise<EncounterOverview | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  const encounterResult = await db
    .select()
    .from(encounters)
    .innerJoin(users, eq(encounters.creatorId, users.id))
    .where(and(eq(encounters.id, id), eq(encounters.visibility, "public")))
    .limit(1);

  if (encounterResult.length === 0) return null;

  const row = encounterResult[0];

  const monsterJoins = await db
    .select({
      monster: monsters,
      quantity: monstersEncounters.quantity,
      isPerHero: monstersEncounters.isPerHero,
    })
    .from(monstersEncounters)
    .innerJoin(monsters, eq(monstersEncounters.monsterId, monsters.id))
    .where(
      and(
        eq(monstersEncounters.encounterId, id),
        eq(monsters.visibility, "public")
      )
    );

  return {
    id: row.encounters.id,
    name: row.encounters.name,
    description: row.encounters.description ?? undefined,
    visibility: row.encounters.visibility === "private" ? "private" : "public",
    heroCount: row.encounters.heroCount,
    heroLevel: row.encounters.heroLevel,
    creator: toUserFromRow(row.users),
    monsters: toEncounterMonsterEntries(monsterJoins),
    createdAt: row.encounters.createdAt
      ? new Date(row.encounters.createdAt)
      : undefined,
  };
};

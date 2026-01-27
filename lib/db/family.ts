import { and, asc, count, eq, inArray } from "drizzle-orm";
import type { Ability, Family, FamilyOverview } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toMonster } from "../services/monsters/converters";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  awards,
  type FamilyRow,
  families,
  type MonsterRow,
  monsters,
  monstersAwards,
  monstersFamilies,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "./schema";

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

interface MonsterFullData {
  monster: MonsterRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
  families: Array<{ family: FamilyRow; creator: UserRow }>;
  remixedFrom: { id: string; name: string; creator: UserRow } | null;
}

async function loadMonsterFullData(
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

const toFamilyOverviewFromRow = (
  family: FamilyRow & { creator: typeof users.$inferSelect },
  monsterCount: number
): FamilyOverview => ({
  id: family.id,
  name: family.name,
  description: family.description ?? undefined,
  abilities: parseJsonField<Omit<Ability, "id">>(family.abilities).map(
    (ability) => ({
      ...ability,
      id: crypto.randomUUID(),
    })
  ),
  visibility: family.visibility as FamilyOverview["visibility"],
  monsterCount,
  creatorId: family.creator.discordId ?? "",
  creator: toUser(family.creator),
});

export const listFamiliesForUser = async (
  discordId: string
): Promise<FamilyOverview[]> => {
  const db = getDatabase();

  const results = await db
    .select({
      family: families,
      creator: users,
      monsterCount: count(monstersFamilies.monsterId),
    })
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .leftJoin(monstersFamilies, eq(families.id, monstersFamilies.familyId))
    .where(eq(users.discordId, discordId))
    .groupBy(families.id)
    .orderBy(asc(families.name));

  return results.map((r) =>
    toFamilyOverviewFromRow({ ...r.family, creator: r.creator }, r.monsterCount)
  );
};

export const getUserFamiliesWithMonsters = async (
  discordId: string
): Promise<Family[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  const familyRows = await db
    .select()
    .from(families)
    .where(eq(families.creatorId, user.id))
    .orderBy(asc(families.name));

  if (familyRows.length === 0) return [];

  const familyIds = familyRows.map((f) => f.id);
  const monsterLinks = await db
    .select({
      familyId: monstersFamilies.familyId,
      monsterId: monstersFamilies.monsterId,
    })
    .from(monstersFamilies)
    .where(inArray(monstersFamilies.familyId, familyIds));

  const monsterIdsByFamily = new Map<string, string[]>();
  for (const link of monsterLinks) {
    const existing = monsterIdsByFamily.get(link.familyId) || [];
    existing.push(link.monsterId);
    monsterIdsByFamily.set(link.familyId, existing);
  }

  const allMonsterIds = [...new Set(monsterLinks.map((l) => l.monsterId))];
  const monsterDataMap = await loadMonsterFullData(db, allMonsterIds);

  return familyRows.map((family) => {
    const familyMonsterIds = monsterIdsByFamily.get(family.id) || [];
    const familyMonsters = familyMonsterIds
      .map((id) => monsterDataMap.get(id))
      .filter((m): m is MonsterFullData => m !== undefined)
      .map((m) => toMonster(toMonsterDataForConverter(m)));

    return {
      id: family.id,
      name: family.name,
      description: family.description ?? undefined,
      abilities: parseJsonField<Omit<Ability, "id">>(family.abilities).map(
        (ability) => ({
          ...ability,
          id: crypto.randomUUID(),
        })
      ),
      visibility: family.visibility as Family["visibility"],
      monsters: familyMonsters,
      monsterCount: familyMonsters.length,
      creatorId: user.discordId ?? "",
      creator: toUser(user),
    };
  });
};

export const listPublicFamiliesHavingMonstersForUser = async (
  creatorId: string
): Promise<Family[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, creatorId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  const familyRows = await db
    .select()
    .from(families)
    .where(eq(families.creatorId, creatorId))
    .orderBy(asc(families.name));

  if (familyRows.length === 0) return [];

  const familyIds = familyRows.map((f) => f.id);
  const monsterLinks = await db
    .select({
      familyId: monstersFamilies.familyId,
      monsterId: monstersFamilies.monsterId,
    })
    .from(monstersFamilies)
    .innerJoin(monsters, eq(monstersFamilies.monsterId, monsters.id))
    .where(
      and(
        inArray(monstersFamilies.familyId, familyIds),
        eq(monsters.visibility, "public")
      )
    );

  const monsterIdsByFamily = new Map<string, string[]>();
  for (const link of monsterLinks) {
    const existing = monsterIdsByFamily.get(link.familyId) || [];
    existing.push(link.monsterId);
    monsterIdsByFamily.set(link.familyId, existing);
  }

  const allMonsterIds = [...new Set(monsterLinks.map((l) => l.monsterId))];
  const monsterDataMap = await loadMonsterFullData(db, allMonsterIds);

  return familyRows.map((family) => {
    const familyMonsterIds = monsterIdsByFamily.get(family.id) || [];
    const familyMonsters = familyMonsterIds
      .map((id) => monsterDataMap.get(id))
      .filter((m): m is MonsterFullData => m !== undefined)
      .map((m) => toMonster(toMonsterDataForConverter(m)));

    return {
      id: family.id,
      name: family.name,
      description: family.description ?? undefined,
      abilities: parseJsonField<Omit<Ability, "id">>(family.abilities).map(
        (ability) => ({
          ...ability,
          id: crypto.randomUUID(),
        })
      ),
      visibility: family.visibility as Family["visibility"],
      monsters: familyMonsters,
      monsterCount: familyMonsters.length,
      creatorId: user.discordId ?? "",
      creator: toUser(user),
    };
  });
};

export const getUserPublicFamiliesCount = async (
  username: string
): Promise<number> => {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userResult.length === 0) return 0;

  const result = await db
    .select({ count: count() })
    .from(families)
    .where(
      and(
        eq(families.creatorId, userResult[0].id),
        eq(families.visibility, "public")
      )
    );

  return result[0]?.count || 0;
};

export const getFamily = async (id: string): Promise<FamilyOverview | null> => {
  const db = getDatabase();

  const results = await db
    .select({
      family: families,
      creator: users,
      monsterCount: count(monstersFamilies.monsterId),
    })
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .leftJoin(monstersFamilies, eq(families.id, monstersFamilies.familyId))
    .where(eq(families.id, id))
    .groupBy(families.id)
    .limit(1);

  if (results.length === 0) return null;
  const r = results[0];

  return toFamilyOverviewFromRow(
    { ...r.family, creator: r.creator },
    r.monsterCount
  );
};

export interface CreateFamilyInput {
  name: string;
  description?: string;
  abilities: Ability[];
  discordId: string;
}

export const createFamily = async ({
  name,
  description,
  abilities,
  discordId,
}: CreateFamilyInput): Promise<FamilyOverview> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const creator = userResult[0];

  const result = await db
    .insert(families)
    .values({
      name,
      description: description || null,
      abilities: JSON.stringify(abilities.map((a) => ({ ...a }))),
      visibility: "public",
      creatorId: creator.id,
    })
    .returning();

  const family = result[0];

  return toFamilyOverviewFromRow({ ...family, creator }, 0);
};

export const updateFamily = async ({
  id,
  name,
  description,
  abilities,
  discordId,
}: {
  id: string;
  name: string;
  description?: string;
  abilities: Ability[];
  discordId: string;
}): Promise<FamilyOverview> => {
  if (!isValidUUID(id)) {
    throw new Error("family not found");
  }

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const creator = userResult[0];

  const result = await db
    .update(families)
    .set({
      name,
      description: description === "" ? null : description,
      abilities: JSON.stringify(
        abilities.map((a) => ({
          ...a,
          Name: undefined,
          Description: undefined,
        }))
      ),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(families.id, id), eq(families.creatorId, creator.id)))
    .returning();

  if (result.length === 0) {
    throw new Error("family not found");
  }

  const family = result[0];

  const countResult = await db
    .select({ count: count() })
    .from(monstersFamilies)
    .where(eq(monstersFamilies.familyId, family.id));

  return toFamilyOverviewFromRow(
    { ...family, creator },
    countResult[0]?.count || 0
  );
};

export const deleteFamily = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) {
    return false;
  }

  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(families)
    .where(and(eq(families.id, id), eq(families.creatorId, userResult[0].id)));

  return result.rowsAffected > 0;
};

export const getRandomFeaturedFamily = async (): Promise<Family | null> => {
  const db = getDatabase();

  const featuredFamilies = await db
    .select()
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .where(eq(families.featured, true));

  if (featuredFamilies.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * featuredFamilies.length);
  const { families: family, users: creator } = featuredFamilies[randomIndex];

  const monsterRows = await db
    .select({ id: monsters.id })
    .from(monsters)
    .innerJoin(monstersFamilies, eq(monsters.id, monstersFamilies.monsterId))
    .where(
      and(
        eq(monstersFamilies.familyId, family.id),
        eq(monsters.visibility, "public")
      )
    );

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: parseJsonField<Omit<Ability, "id">>(family.abilities).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: family.visibility as Family["visibility"],
    monsters: [],
    monsterCount: monsterRows.length,
    creatorId: creator.discordId ?? "",
    creator: toUser(creator),
  };
};

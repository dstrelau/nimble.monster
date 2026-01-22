import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import type {
  Award,
  Source,
  Subclass,
  SubclassAbility,
  SubclassClass,
  SubclassLevel,
  SubclassMini,
  User,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  awards,
  type SourceRow,
  type SubclassAbilityRow,
  type SubclassRow,
  sources,
  subclassAbilities,
  subclasses,
  subclassesAwards,
  type UserRow,
  users,
} from "./schema";

const toUser = (u: UserRow): User => ({
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

const toSource = (s: SourceRow | null): Source | undefined => {
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

const toAward = (a: AwardRow): Award => ({
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

const toSubclassMini = (s: SubclassRow): SubclassMini => ({
  id: s.id,
  name: s.name,
  className: s.className as SubclassClass,
  namePreface: s.namePreface || undefined,
  tagline: s.tagline || undefined,
  visibility: s.visibility as "public" | "private",
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

interface SubclassFullData {
  subclass: SubclassRow;
  creator: UserRow;
  source: SourceRow | null;
  abilities: SubclassAbilityRow[];
  awards: AwardRow[];
}

const toSubclass = (data: SubclassFullData): Subclass => {
  // Group abilities by level
  const levelGroups = data.abilities.reduce(
    (acc, ability) => {
      if (!acc[ability.level]) {
        acc[ability.level] = [];
      }
      acc[ability.level].push({
        id: ability.id,
        name: ability.name,
        description: ability.description,
      });
      return acc;
    },
    {} as Record<number, SubclassAbility[]>
  );

  // Convert to levels array, sorted by level
  const levels: SubclassLevel[] = Object.entries(levelGroups)
    .map(([level, abilities]) => ({
      level: parseInt(level, 10),
      abilities: abilities.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.level - b.level);

  return {
    ...toSubclassMini(data.subclass),
    description: data.subclass.description || undefined,
    levels,
    creator: toUser(data.creator),
    source: toSource(data.source),
    awards: data.awards.length > 0 ? data.awards.map(toAward) : undefined,
    updatedAt: data.subclass.updatedAt
      ? new Date(data.subclass.updatedAt)
      : new Date(),
  };
};

async function loadSubclassFullData(
  db: ReturnType<typeof getDatabase>,
  subclassIds: string[]
): Promise<Map<string, SubclassFullData>> {
  if (subclassIds.length === 0) return new Map();

  const subclassRows = await db
    .select()
    .from(subclasses)
    .innerJoin(users, eq(subclasses.userId, users.id))
    .leftJoin(sources, eq(subclasses.sourceId, sources.id))
    .where(inArray(subclasses.id, subclassIds));

  const abilityRows = await db
    .select()
    .from(subclassAbilities)
    .where(inArray(subclassAbilities.subclassId, subclassIds))
    .orderBy(asc(subclassAbilities.level), asc(subclassAbilities.orderIndex));

  const awardRows = await db
    .select({ subclassId: subclassesAwards.subclassId, award: awards })
    .from(subclassesAwards)
    .innerJoin(awards, eq(subclassesAwards.awardId, awards.id))
    .where(inArray(subclassesAwards.subclassId, subclassIds));

  const abilitiesBySubclass = new Map<string, SubclassAbilityRow[]>();
  for (const ability of abilityRows) {
    const existing = abilitiesBySubclass.get(ability.subclassId) || [];
    existing.push(ability);
    abilitiesBySubclass.set(ability.subclassId, existing);
  }

  const awardsBySubclass = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsBySubclass.get(row.subclassId) || [];
    existing.push(row.award);
    awardsBySubclass.set(row.subclassId, existing);
  }

  const result = new Map<string, SubclassFullData>();
  for (const row of subclassRows) {
    result.set(row.subclasses.id, {
      subclass: row.subclasses,
      creator: row.users,
      source: row.sources,
      abilities: abilitiesBySubclass.get(row.subclasses.id) || [],
      awards: awardsBySubclass.get(row.subclasses.id) || [],
    });
  }

  return result;
}

export const deleteSubclass = async (input: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(input.id)) return false;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(subclasses)
    .where(
      and(eq(subclasses.id, input.id), eq(subclasses.userId, userResult[0].id))
    );

  return result.rowsAffected > 0;
};

export const listPublicSubclasses = async (): Promise<Subclass[]> => {
  const db = getDatabase();

  const subclassRows = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(eq(subclasses.visibility, "public"))
    .orderBy(asc(subclasses.name));

  if (subclassRows.length === 0) return [];

  const ids = subclassRows.map((r) => r.id);
  const dataMap = await loadSubclassFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is SubclassFullData => d !== undefined)
    .map(toSubclass);
};

export const listSubclassMinis = async (): Promise<SubclassMini[]> => {
  const db = getDatabase();

  const rows = await db
    .select()
    .from(subclasses)
    .where(eq(subclasses.visibility, "public"))
    .orderBy(asc(subclasses.name));

  return rows.map(toSubclassMini);
};

export const findSubclass = async (id: string): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();
  const dataMap = await loadSubclassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSubclass(data) : null;
};

export const findPublicSubclassById = async (
  id: string
): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const check = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(and(eq(subclasses.id, id), eq(subclasses.visibility, "public")))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadSubclassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSubclass(data) : null;
};

export const findSubclassWithCreator = async (
  id: string,
  creatorId: string
): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const check = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(and(eq(subclasses.id, id), eq(subclasses.userId, creatorId)))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadSubclassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSubclass(data) : null;
};

export const listPublicSubclassesForUser = async (
  userId: string
): Promise<Subclass[]> => {
  const db = getDatabase();

  const subclassRows = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(
      and(eq(subclasses.userId, userId), eq(subclasses.visibility, "public"))
    )
    .orderBy(asc(subclasses.name));

  if (subclassRows.length === 0) return [];

  const ids = subclassRows.map((r) => r.id);
  const dataMap = await loadSubclassFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is SubclassFullData => d !== undefined)
    .map(toSubclass);
};

export const listAllSubclassesForDiscordID = async (
  discordId: string
): Promise<Subclass[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];

  const subclassRows = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(eq(subclasses.userId, userResult[0].id))
    .orderBy(asc(subclasses.name));

  if (subclassRows.length === 0) return [];

  const ids = subclassRows.map((r) => r.id);
  const dataMap = await loadSubclassFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is SubclassFullData => d !== undefined)
    .map(toSubclass);
};

export interface CreateSubclassInput {
  name: string;
  className: SubclassClass;
  namePreface?: string;
  tagline?: string;
  description?: string;
  visibility: "public" | "private";
  levels: SubclassLevel[];
  discordId: string;
  sourceId?: string;
}

export const createSubclass = async (
  input: CreateSubclassInput
): Promise<Subclass> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const subclassId = crypto.randomUUID();

  await db.insert(subclasses).values({
    id: subclassId,
    name: input.name,
    className: input.className,
    namePreface: input.namePreface || undefined,
    tagline: input.tagline || undefined,
    description: input.description || undefined,
    visibility: input.visibility,
    userId: userResult[0].id,
    sourceId: input.sourceId || undefined,
  });

  // Insert abilities
  const abilityInserts: {
    id: string;
    subclassId: string;
    level: number;
    name: string;
    description: string;
    orderIndex: number;
  }[] = [];

  for (const level of input.levels) {
    level.abilities.forEach((ability, index) => {
      abilityInserts.push({
        id: crypto.randomUUID(),
        subclassId,
        level: level.level,
        name: ability.name,
        description: ability.description,
        orderIndex: index,
      });
    });
  }

  if (abilityInserts.length > 0) {
    await db.insert(subclassAbilities).values(abilityInserts);
  }

  const dataMap = await loadSubclassFullData(db, [subclassId]);
  const data = dataMap.get(subclassId);

  if (!data) {
    throw new Error("Failed to create subclass");
  }

  return toSubclass(data);
};

export interface UpdateSubclassInput extends CreateSubclassInput {
  id: string;
}

export const updateSubclass = async (
  input: UpdateSubclassInput
): Promise<Subclass> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  // Verify ownership
  const existing = await db
    .select()
    .from(subclasses)
    .where(
      and(eq(subclasses.id, input.id), eq(subclasses.userId, userResult[0].id))
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Subclass not found");
  }

  await db
    .update(subclasses)
    .set({
      name: input.name,
      className: input.className,
      namePreface: input.namePreface || undefined,
      tagline: input.tagline || undefined,
      description: input.description || undefined,
      visibility: input.visibility,
      sourceId: input.sourceId || undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subclasses.id, input.id));

  // Replace abilities
  await db
    .delete(subclassAbilities)
    .where(eq(subclassAbilities.subclassId, input.id));

  const abilityInserts: {
    id: string;
    subclassId: string;
    level: number;
    name: string;
    description: string;
    orderIndex: number;
  }[] = [];

  for (const level of input.levels) {
    level.abilities.forEach((ability, index) => {
      abilityInserts.push({
        id: crypto.randomUUID(),
        subclassId: input.id,
        level: level.level,
        name: ability.name,
        description: ability.description,
        orderIndex: index,
      });
    });
  }

  if (abilityInserts.length > 0) {
    await db.insert(subclassAbilities).values(abilityInserts);
  }

  const dataMap = await loadSubclassFullData(db, [input.id]);
  const data = dataMap.get(input.id);

  if (!data) {
    throw new Error("Failed to update subclass");
  }

  return toSubclass(data);
};

export interface SearchSubclassParams {
  creatorId?: string;
  searchTerm?: string;
  className?: string;
  sortBy?: "name" | "className";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicSubclassMinis = async (
  params: SearchSubclassParams
): Promise<SubclassMini[]> => {
  const db = getDatabase();

  const conditions: ReturnType<typeof eq>[] = [
    eq(subclasses.visibility, "public"),
  ];

  if (params.creatorId) {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.discordId, params.creatorId))
      .limit(1);

    if (userResult.length > 0) {
      conditions.push(eq(subclasses.userId, userResult[0].id));
    }
  }

  if (params.className) {
    conditions.push(eq(subclasses.className, params.className));
  }

  let query = db.select().from(subclasses).$dynamic();

  if (params.searchTerm) {
    const searchCondition = or(
      like(subclasses.name, `%${params.searchTerm}%`),
      like(subclasses.tagline, `%${params.searchTerm}%`)
    );
    query = query.where(and(...conditions, searchCondition));
  } else {
    query = query.where(and(...conditions));
  }

  // Add ordering
  const orderFn = params.sortDirection === "desc" ? desc : asc;
  if (params.sortBy === "className") {
    query = query.orderBy(orderFn(subclasses.className), asc(subclasses.name));
  } else {
    query = query.orderBy(orderFn(subclasses.name));
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const rows = await query;
  return rows.map(toSubclassMini);
};

export const findSubclassWithCreatorDiscordId = async (
  id: string,
  discordId: string
): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;

  const check = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(and(eq(subclasses.id, id), eq(subclasses.userId, userResult[0].id)))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadSubclassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSubclass(data) : null;
};

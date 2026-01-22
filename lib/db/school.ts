import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  Award,
  Source,
  Spell,
  SpellSchool,
  SpellSchoolMini,
  SpellTarget,
  User,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  awards,
  type SourceRow,
  type SpellRow,
  type SpellSchoolRow,
  sources,
  spellSchools,
  spellSchoolsAwards,
  spells,
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

const toSpellSchoolMini = (s: SpellSchoolRow): SpellSchoolMini => ({
  id: s.id,
  name: s.name,
  visibility: s.visibility as "public" | "private",
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

const toSpell = (s: SpellRow): Spell => ({
  id: s.id,
  name: s.name,
  schoolId: s.schoolId,
  tier: s.tier,
  actions: s.actions,
  reaction: s.reaction || false,
  target: (s.targetType || undefined) as SpellTarget | undefined,
  damage: s.damage || undefined,
  description: s.description || undefined,
  highLevels: s.highLevels || undefined,
  concentration: s.concentration || undefined,
  upcast: s.upcast || undefined,
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
  updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
});

interface SpellSchoolFullData {
  school: SpellSchoolRow;
  creator: UserRow;
  source: SourceRow | null;
  spells: SpellRow[];
  awards: AwardRow[];
}

const toSpellSchool = (data: SpellSchoolFullData): SpellSchool => ({
  ...toSpellSchoolMini(data.school),
  description: data.school.description || undefined,
  spells: data.spells.map(toSpell).sort((a, b) => a.tier - b.tier),
  creator: toUser(data.creator),
  source: toSource(data.source),
  awards: data.awards.length > 0 ? data.awards.map(toAward) : undefined,
  updatedAt: data.school.updatedAt
    ? new Date(data.school.updatedAt)
    : new Date(),
});

async function loadSpellSchoolFullData(
  db: ReturnType<typeof getDatabase>,
  schoolIds: string[]
): Promise<Map<string, SpellSchoolFullData>> {
  if (schoolIds.length === 0) return new Map();

  const schoolRows = await db
    .select()
    .from(spellSchools)
    .innerJoin(users, eq(spellSchools.userId, users.id))
    .leftJoin(sources, eq(spellSchools.sourceId, sources.id))
    .where(inArray(spellSchools.id, schoolIds));

  const spellRows = await db
    .select()
    .from(spells)
    .where(inArray(spells.schoolId, schoolIds))
    .orderBy(asc(spells.tier), asc(spells.name));

  const awardRows = await db
    .select({ schoolId: spellSchoolsAwards.schoolId, award: awards })
    .from(spellSchoolsAwards)
    .innerJoin(awards, eq(spellSchoolsAwards.awardId, awards.id))
    .where(inArray(spellSchoolsAwards.schoolId, schoolIds));

  const spellsBySchool = new Map<string, SpellRow[]>();
  for (const spell of spellRows) {
    const existing = spellsBySchool.get(spell.schoolId) || [];
    existing.push(spell);
    spellsBySchool.set(spell.schoolId, existing);
  }

  const awardsBySchool = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsBySchool.get(row.schoolId) || [];
    existing.push(row.award);
    awardsBySchool.set(row.schoolId, existing);
  }

  const result = new Map<string, SpellSchoolFullData>();
  for (const row of schoolRows) {
    result.set(row.spell_schools.id, {
      school: row.spell_schools,
      creator: row.users,
      source: row.sources,
      spells: spellsBySchool.get(row.spell_schools.id) || [],
      awards: awardsBySchool.get(row.spell_schools.id) || [],
    });
  }

  return result;
}

export const deleteSpellSchool = async (input: {
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
    .delete(spellSchools)
    .where(
      and(
        eq(spellSchools.id, input.id),
        eq(spellSchools.userId, userResult[0].id)
      )
    );

  return result.rowsAffected > 0;
};

export const listPublicSpellSchools = async (): Promise<SpellSchool[]> => {
  const db = getDatabase();

  const schoolRows = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(eq(spellSchools.visibility, "public"))
    .orderBy(asc(spellSchools.name));

  if (schoolRows.length === 0) return [];

  const ids = schoolRows.map((r) => r.id);
  const dataMap = await loadSpellSchoolFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is SpellSchoolFullData => d !== undefined)
    .map(toSpellSchool);
};

export const listSpellSchoolMinis = async (): Promise<SpellSchoolMini[]> => {
  const db = getDatabase();

  const rows = await db
    .select()
    .from(spellSchools)
    .where(eq(spellSchools.visibility, "public"))
    .orderBy(asc(spellSchools.name));

  return rows.map(toSpellSchoolMini);
};

export const findSpellSchool = async (
  id: string
): Promise<SpellSchool | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();
  const dataMap = await loadSpellSchoolFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSpellSchool(data) : null;
};

export const findPublicSpellSchoolById = async (
  id: string
): Promise<SpellSchool | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const check = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(and(eq(spellSchools.id, id), eq(spellSchools.visibility, "public")))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadSpellSchoolFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSpellSchool(data) : null;
};

export const findSpellSchoolWithCreator = async (
  id: string,
  creatorId: string
): Promise<SpellSchool | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const check = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(and(eq(spellSchools.id, id), eq(spellSchools.userId, creatorId)))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadSpellSchoolFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSpellSchool(data) : null;
};

export const listPublicSpellSchoolsForUser = async (
  userId: string
): Promise<SpellSchool[]> => {
  const db = getDatabase();

  const schoolRows = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(
      and(
        eq(spellSchools.userId, userId),
        eq(spellSchools.visibility, "public")
      )
    )
    .orderBy(asc(spellSchools.name));

  if (schoolRows.length === 0) return [];

  const ids = schoolRows.map((r) => r.id);
  const dataMap = await loadSpellSchoolFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is SpellSchoolFullData => d !== undefined)
    .map(toSpellSchool);
};

export const listAllSpellSchoolsForDiscordID = async (
  discordId: string
): Promise<SpellSchool[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];

  const schoolRows = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(eq(spellSchools.userId, userResult[0].id))
    .orderBy(asc(spellSchools.name));

  if (schoolRows.length === 0) return [];

  const ids = schoolRows.map((r) => r.id);
  const dataMap = await loadSpellSchoolFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is SpellSchoolFullData => d !== undefined)
    .map(toSpellSchool);
};

export interface CreateSpellSchoolInput {
  name: string;
  description?: string;
  visibility: "public" | "private";
  spells?: Array<{
    name: string;
    tier: number;
    actions: number;
    reaction?: boolean;
    target?: SpellTarget;
    damage?: string;
    description?: string;
    highLevels?: string;
    concentration?: string;
    upcast?: string;
  }>;
  discordId: string;
  sourceId?: string;
}

export const createSpellSchool = async (
  input: CreateSpellSchoolInput
): Promise<SpellSchool> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const schoolId = crypto.randomUUID();

  await db.insert(spellSchools).values({
    id: schoolId,
    name: input.name,
    description: input.description || undefined,
    visibility: input.visibility,
    userId: userResult[0].id,
    sourceId: input.sourceId || undefined,
  });

  // Insert spells
  if (input.spells && input.spells.length > 0) {
    await db.insert(spells).values(
      input.spells.map((spell) => ({
        id: crypto.randomUUID(),
        schoolId,
        name: spell.name,
        tier: spell.tier,
        actions: spell.actions,
        reaction: spell.reaction || false,
        target: spell.target || undefined,
        damage: spell.damage || undefined,
        description: spell.description || undefined,
        highLevels: spell.highLevels || undefined,
        concentration: spell.concentration || undefined,
        upcast: spell.upcast || undefined,
      }))
    );
  }

  const dataMap = await loadSpellSchoolFullData(db, [schoolId]);
  const data = dataMap.get(schoolId);

  if (!data) {
    throw new Error("Failed to create spell school");
  }

  return toSpellSchool(data);
};

export interface UpdateSpellSchoolInput extends CreateSpellSchoolInput {
  id: string;
}

export const updateSpellSchool = async (
  input: UpdateSpellSchoolInput
): Promise<SpellSchool> => {
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
    .from(spellSchools)
    .where(
      and(
        eq(spellSchools.id, input.id),
        eq(spellSchools.userId, userResult[0].id)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Spell school not found");
  }

  await db
    .update(spellSchools)
    .set({
      name: input.name,
      description: input.description || undefined,
      visibility: input.visibility,
      sourceId: input.sourceId || undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(spellSchools.id, input.id));

  // Replace spells
  await db.delete(spells).where(eq(spells.schoolId, input.id));

  if (input.spells && input.spells.length > 0) {
    await db.insert(spells).values(
      input.spells.map((spell) => ({
        id: crypto.randomUUID(),
        schoolId: input.id,
        name: spell.name,
        tier: spell.tier,
        actions: spell.actions,
        reaction: spell.reaction || false,
        target: spell.target || undefined,
        damage: spell.damage || undefined,
        description: spell.description || undefined,
        highLevels: spell.highLevels || undefined,
        concentration: spell.concentration || undefined,
        upcast: spell.upcast || undefined,
      }))
    );
  }

  const dataMap = await loadSpellSchoolFullData(db, [input.id]);
  const data = dataMap.get(input.id);

  if (!data) {
    throw new Error("Failed to update spell school");
  }

  return toSpellSchool(data);
};

export const findSpellSchoolWithCreatorDiscordId = async (
  id: string,
  discordId: string
): Promise<SpellSchool | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;

  const check = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(
      and(eq(spellSchools.id, id), eq(spellSchools.userId, userResult[0].id))
    )
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadSpellSchoolFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toSpellSchool(data) : null;
};

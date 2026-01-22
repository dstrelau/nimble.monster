import { and, eq } from "drizzle-orm";
import type { Spell, SpellSchool, User } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type SpellRow,
  type SpellSchoolRow,
  spellSchools,
  spells,
  type UserRow,
  users,
} from "./schema";

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

const toSpellFromRow = (
  s: SpellRow,
  school?: { school: SpellSchoolRow; creator: UserRow }
): Spell => {
  let target: Spell["target"];
  if (s.targetType === "self") {
    target = { type: "self" };
  } else if (s.targetType === "aoe" && s.targetKind && s.targetDistance) {
    target = {
      type: "aoe",
      kind: s.targetKind as "range" | "reach" | "line" | "cone",
      distance: s.targetDistance,
    };
  } else if (s.targetType && s.targetKind && s.targetDistance) {
    target = {
      type: s.targetType as "single" | "single+" | "multi" | "special",
      kind: s.targetKind as "range" | "reach",
      distance: s.targetDistance,
    };
  }

  let schoolData: SpellSchool | undefined;
  if (school) {
    schoolData = {
      id: school.school.id,
      name: school.school.name,
      description: school.school.description || undefined,
      visibility: (school.school.visibility ?? "public") as
        | "public"
        | "private",
      spells: [],
      creator: toUserFromRow(school.creator),
      createdAt: school.school.createdAt
        ? new Date(school.school.createdAt)
        : new Date(),
      updatedAt: school.school.updatedAt
        ? new Date(school.school.updatedAt)
        : new Date(),
    };
  }

  return {
    id: s.id,
    schoolId: s.schoolId,
    name: s.name,
    tier: s.tier,
    actions: s.actions,
    reaction: s.reaction ?? false,
    target,
    damage: s.damage || undefined,
    description: s.description || undefined,
    highLevels: s.highLevels || undefined,
    concentration: s.concentration || undefined,
    upcast: s.upcast || undefined,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    school: schoolData,
  };
};

export const findSpell = async (id: string): Promise<Spell | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const result = await db
    .select()
    .from(spells)
    .innerJoin(spellSchools, eq(spells.schoolId, spellSchools.id))
    .innerJoin(users, eq(spellSchools.userId, users.id))
    .where(eq(spells.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];
  return toSpellFromRow(row.spells, {
    school: row.spell_schools,
    creator: row.users,
  });
};

export const findPublicSpellById = async (
  id: string
): Promise<Spell | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const result = await db
    .select()
    .from(spells)
    .innerJoin(spellSchools, eq(spells.schoolId, spellSchools.id))
    .innerJoin(users, eq(spellSchools.userId, users.id))
    .where(eq(spells.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];

  if (row.spell_schools.visibility !== "public") {
    return null;
  }

  return toSpellFromRow(row.spells, {
    school: row.spell_schools,
    creator: row.users,
  });
};

export const findSpellWithCreator = async (
  id: string,
  creatorId: string
): Promise<Spell | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const result = await db
    .select()
    .from(spells)
    .innerJoin(spellSchools, eq(spells.schoolId, spellSchools.id))
    .innerJoin(users, eq(spellSchools.userId, users.id))
    .where(and(eq(spells.id, id), eq(spellSchools.userId, creatorId)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];
  return toSpellFromRow(row.spells, {
    school: row.spell_schools,
    creator: row.users,
  });
};

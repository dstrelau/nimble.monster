import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { spellSchools, spells } from "@/lib/db/schema";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import type { Spell, SpellSchool, SpellTarget } from "@/lib/types";

const buildSpellTarget = (row: {
  targetType: string | null;
  targetKind: string | null;
  targetDistance: number | null;
}): SpellTarget | undefined => {
  if (!row.targetType) return undefined;
  if (row.targetType === "self") {
    return { type: "self" };
  }
  if (row.targetType === "aoe" && row.targetKind) {
    return {
      type: "aoe",
      kind: row.targetKind as "range" | "reach" | "line" | "cone",
      distance: row.targetDistance ?? undefined,
    };
  }
  if (row.targetKind) {
    return {
      type: row.targetType as "single" | "single+" | "multi" | "special",
      kind: row.targetKind as "range" | "reach",
      distance: row.targetDistance ?? undefined,
    };
  }
  return undefined;
};

export const upsertOfficialSpellSchool = async (input: {
  id?: string;
  name: string;
  description?: string;
  spells: Array<{
    name: string;
    tier: number;
    actions: number;
    reaction?: boolean;
    target?: SpellTarget;
    utility?: boolean;
    damage?: string;
    description?: string;
    highLevels?: string;
    concentration?: string;
    upcast?: string;
  }>;
  sourceId?: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(
      and(
        eq(spellSchools.name, input.name),
        eq(spellSchools.userId, OFFICIAL_USER_ID)
      )
    )
    .limit(1);

  let schoolId: string;

  if (existing.length > 0) {
    schoolId = existing[0].id;
    await db
      .update(spellSchools)
      .set({
        description: input.description || null,
        sourceId: input.sourceId || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(spellSchools.id, schoolId));
  } else {
    schoolId = input.id || crypto.randomUUID();
    await db.insert(spellSchools).values({
      id: schoolId,
      name: input.name,
      description: input.description || null,
      visibility: "public",
      userId: OFFICIAL_USER_ID,
      sourceId: input.sourceId || null,
      createdAt: "2024-01-01 00:00:00",
    });
  }

  await db.delete(spells).where(eq(spells.schoolId, schoolId));

  const spellInserts: Array<{
    id: string;
    schoolId: string;
    name: string;
    tier: number;
    actions: number;
    reaction: boolean;
    utility: boolean;
    targetType: string | undefined;
    targetKind: string | undefined;
    targetDistance: number | undefined;
    damage: string | undefined;
    description: string | undefined;
    highLevels: string | undefined;
    concentration: string | undefined;
    upcast: string | undefined;
  }> = [];

  for (const spell of input.spells) {
    spellInserts.push({
      id: crypto.randomUUID(),
      schoolId,
      name: spell.name,
      tier: spell.tier,
      actions: spell.actions,
      reaction: spell.reaction || false,
      utility: spell.utility || false,
      targetType: spell.target?.type || undefined,
      targetKind:
        spell.target && "kind" in spell.target ? spell.target.kind : undefined,
      targetDistance:
        spell.target && "distance" in spell.target
          ? spell.target.distance
          : undefined,
      damage: spell.damage || undefined,
      description: spell.description || undefined,
      highLevels: spell.highLevels || undefined,
      concentration: spell.concentration || undefined,
      upcast: spell.upcast || undefined,
    });
  }

  if (spellInserts.length > 0) {
    await db.insert(spells).values(spellInserts);
  }
};

export const findOfficialSpellSchoolsByNames = async (
  names: string[]
): Promise<Map<string, SpellSchool>> => {
  if (names.length === 0) return new Map();

  const db = getDatabase();
  const result = new Map<string, SpellSchool>();

  const rows = await db
    .select()
    .from(spellSchools)
    .where(
      and(
        inArray(spellSchools.name, names),
        eq(spellSchools.userId, OFFICIAL_USER_ID)
      )
    );

  if (rows.length === 0) return result;

  const schoolIds = rows.map((r) => r.id);
  const allSpells = await db
    .select()
    .from(spells)
    .where(inArray(spells.schoolId, schoolIds));

  const spellsBySchool = new Map<string, typeof allSpells>();
  for (const spell of allSpells) {
    const existing = spellsBySchool.get(spell.schoolId) || [];
    existing.push(spell);
    spellsBySchool.set(spell.schoolId, existing);
  }

  for (const row of rows) {
    const schoolSpells = spellsBySchool.get(row.id) || [];

    const mappedSpells: Spell[] = schoolSpells
      .map((s) => ({
        id: s.id,
        name: s.name,
        schoolId: s.schoolId,
        tier: s.tier,
        actions: s.actions,
        reaction: s.reaction || false,
        utility: s.utility || false,
        target: buildSpellTarget(s),
        damage: s.damage || undefined,
        description: s.description || undefined,
        highLevels: s.highLevels || undefined,
        concentration: s.concentration || undefined,
        upcast: s.upcast || undefined,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      }))
      .sort((a, b) => a.tier - b.tier);

    result.set(row.name, {
      id: row.id,
      name: row.name,
      visibility: (row.visibility ?? "public") as "public" | "private",
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
      description: row.description || undefined,
      spells: mappedSpells,
      creator: {
        id: OFFICIAL_USER_ID,
        discordId: "",
        username: "",
        displayName: "Official",
        imageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      },
    });
  }

  return result;
};

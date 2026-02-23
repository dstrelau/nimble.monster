import { trace } from "@opentelemetry/api";
import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { subclassAbilities, subclasses } from "@/lib/db/schema";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import {
  SUBCLASS_NAME_PREFIXES,
  type Subclass,
  type SubclassClass,
} from "@/lib/types";

export const upsertOfficialSubclass = async (input: {
  id?: string;
  name: string;
  className: string;
  tagline?: string;
  description?: string;
  levels: Array<{
    level: number;
    abilities: Array<{ name: string; description: string }>;
  }>;
  sourceId?: string;
}): Promise<void> => {
  const db = await getDatabase();

  const namePreface =
    SUBCLASS_NAME_PREFIXES[input.className as SubclassClass] || null;

  const existing = await db
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(
      and(
        eq(subclasses.name, input.name),
        eq(subclasses.className, input.className),
        eq(subclasses.userId, OFFICIAL_USER_ID)
      )
    )
    .limit(1);

  const subclassId =
    existing.length > 0 ? existing[0].id : (input.id ?? crypto.randomUUID());

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

  try {
    await db.transaction(async (tx) => {
      if (existing.length > 0) {
        await tx
          .update(subclasses)
          .set({
            namePreface,
            tagline: input.tagline || null,
            description: input.description || null,
            sourceId: input.sourceId || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(subclasses.id, subclassId));
      } else {
        await tx.insert(subclasses).values({
          id: subclassId,
          name: input.name,
          className: input.className,
          namePreface,
          tagline: input.tagline || null,
          description: input.description || null,
          visibility: "public",
          userId: OFFICIAL_USER_ID,
          sourceId: input.sourceId || null,
          // Fixed timestamp so official content sorts consistently before user content
          createdAt: "2024-01-01 00:00:00",
        });
      }

      await tx
        .delete(subclassAbilities)
        .where(eq(subclassAbilities.subclassId, subclassId));

      if (abilityInserts.length > 0) {
        await tx.insert(subclassAbilities).values(abilityInserts);
      }
    });
  } catch (error) {
    if (error instanceof Error && error.cause instanceof Error) {
      trace
        .getActiveSpan()
        ?.setAttribute("exception.cause", error.cause.message);
    }
    throw error;
  }
};

export const findOfficialSubclassesByNames = async (
  names: Array<{ name: string; className: string }>
): Promise<Map<string, Subclass>> => {
  if (names.length === 0) return new Map();

  const db = await getDatabase();
  const result = new Map<string, Subclass>();

  const allNames = names.map((n) => n.name);
  const rows = await db
    .select()
    .from(subclasses)
    .where(
      and(
        inArray(subclasses.name, allNames),
        eq(subclasses.userId, OFFICIAL_USER_ID)
      )
    );

  // Filter to only rows matching the requested name+className pairs
  const nameClassSet = new Set(names.map((n) => `${n.className}:${n.name}`));
  const matchingRows = rows.filter((row) =>
    nameClassSet.has(`${row.className}:${row.name}`)
  );

  if (matchingRows.length === 0) return result;

  const subclassIds = matchingRows.map((r) => r.id);
  const allAbilities = await db
    .select()
    .from(subclassAbilities)
    .where(inArray(subclassAbilities.subclassId, subclassIds));

  const abilitiesBySubclass = new Map<string, typeof allAbilities>();
  for (const ability of allAbilities) {
    const existing = abilitiesBySubclass.get(ability.subclassId) || [];
    existing.push(ability);
    abilitiesBySubclass.set(ability.subclassId, existing);
  }

  for (const row of matchingRows) {
    const abilities = abilitiesBySubclass.get(row.id) || [];

    const levelGroups = abilities.reduce(
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
      {} as Record<
        number,
        Array<{ id: string; name: string; description: string }>
      >
    );

    const levels = Object.entries(levelGroups)
      .map(([level, abs]) => ({
        level: parseInt(level, 10),
        abilities: abs.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.level - b.level);

    const key = `${row.className}:${row.name}`;
    result.set(key, {
      id: row.id,
      name: row.name,
      className: row.className as Subclass["className"],
      namePreface: row.namePreface || undefined,
      tagline: row.tagline || undefined,
      description: row.description || undefined,
      visibility: (row.visibility ?? "public") as "public" | "private",
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
      levels,
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

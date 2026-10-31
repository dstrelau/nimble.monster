import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { extractConditions } from "@/lib/conditions";
import { getDatabase } from "@/lib/db/drizzle";
import { conditions, monstersConditions } from "@/lib/db/schema";

export function extractAllConditions(data: {
  actions: Array<{ description?: string }>;
  abilities: Array<{ description?: string; Description?: string }>;
  bloodied?: string;
  lastStand?: string;
  moreInfo?: string;
}): string[] {
  const allText = [
    ...data.actions.map((action) => action.description || ""),
    ...data.abilities.map(
      (ability) => ability.description || ability.Description || ""
    ),
    data.bloodied || "",
    data.lastStand || "",
    data.moreInfo || "",
  ].join(" ");

  return extractConditions(allText);
}

export async function syncMonsterConditions(
  monsterId: string,
  conditionNames: string[],
  ownerId: string
): Promise<void> {
  await getDatabase().transaction(async (tx) => {
    const matches = conditionNames.length
      ? await tx
          .select({ id: conditions.id, name: conditions.name })
          .from(conditions)
          .where(
            and(
              inArray(sql`lower(${conditions.name})`, conditionNames),
              or(
                eq(conditions.creatorId, ownerId),
                eq(conditions.official, true)
              )
            )
          )
          // A creator's definition overrides the official one, never another user's.
          .orderBy(desc(eq(conditions.creatorId, ownerId)), asc(conditions.id))
      : [];
    const byName = new Map<string, string>();
    for (const match of matches) {
      const name = match.name.toLowerCase();
      if (!byName.has(name)) byName.set(name, match.id);
    }

    const expected = new Set(byName.values());
    const existing = await tx
      .select({ conditionId: monstersConditions.conditionId })
      .from(monstersConditions)
      .where(eq(monstersConditions.monsterId, monsterId));
    const current = new Set(existing.map((link) => link.conditionId));
    const added = [...expected].filter((id) => !current.has(id));
    const removed = [...current].filter((id) => !expected.has(id));

    if (removed.length) {
      await tx
        .delete(monstersConditions)
        .where(
          and(
            eq(monstersConditions.monsterId, monsterId),
            inArray(monstersConditions.conditionId, removed)
          )
        );
    }
    if (added.length) {
      await tx.insert(monstersConditions).values(
        added.map((conditionId) => ({
          monsterId,
          conditionId,
          inline: false,
        }))
      );
    }
  });
}

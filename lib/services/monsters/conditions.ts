import { eq, inArray } from "drizzle-orm";
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
  conditionNames: string[]
): Promise<void> {
  const db = await getDatabase();

  if (conditionNames.length === 0) {
    await db
      .delete(monstersConditions)
      .where(eq(monstersConditions.monsterId, monsterId));
    return;
  }

  // Find existing conditions by name
  const existingConditions = await db
    .select({ id: conditions.id, name: conditions.name })
    .from(conditions)
    .where(inArray(conditions.name, conditionNames));

  const foundConditionIds = existingConditions.map((c) => c.id);

  // Delete existing monster-condition links
  await db
    .delete(monstersConditions)
    .where(eq(monstersConditions.monsterId, monsterId));

  // Create new links
  if (foundConditionIds.length > 0) {
    await db.insert(monstersConditions).values(
      foundConditionIds.map((conditionId) => ({
        monsterId,
        conditionId,
        inline: false,
      }))
    );
  }
}

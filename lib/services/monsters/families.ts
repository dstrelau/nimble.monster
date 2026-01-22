import { eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { monstersFamilies } from "@/lib/db/schema";

export async function syncMonsterFamilies(
  monsterId: string,
  familyIds: string[]
): Promise<void> {
  const db = await getDatabase();

  // Delete existing monster-family links
  await db
    .delete(monstersFamilies)
    .where(eq(monstersFamilies.monsterId, monsterId));

  // Create new links
  if (familyIds.length > 0) {
    await db.insert(monstersFamilies).values(
      familyIds.map((familyId) => ({
        monsterId,
        familyId,
      }))
    );
  }
}

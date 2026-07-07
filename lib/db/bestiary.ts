import { count, eq } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import { companions, monsters } from "./schema";

export interface BestiaryCounts {
  monsters: number;
  companions: number;
}

export async function getBestiaryCounts(): Promise<BestiaryCounts> {
  const db = getDatabase();
  const [monsterCount, companionCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(monsters)
      .where(eq(monsters.visibility, "public")),
    db
      .select({ count: count() })
      .from(companions)
      .where(eq(companions.visibility, "public")),
  ]);

  return {
    monsters: monsterCount[0]?.count ?? 0,
    companions: companionCount[0]?.count ?? 0,
  };
}

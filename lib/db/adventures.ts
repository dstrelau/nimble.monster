import { count, eq } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import { encounters } from "./schema";

export interface AdventureCounts {
  encounters: number;
}

export async function getAdventureCounts(): Promise<AdventureCounts> {
  const db = getDatabase();
  const [encounterCount] = await db
    .select({ count: count() })
    .from(encounters)
    .where(eq(encounters.visibility, "public"));

  return {
    encounters: encounterCount?.count ?? 0,
  };
}

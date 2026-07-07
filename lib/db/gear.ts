import { count, eq } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import { items } from "./schema";

export interface GearCounts {
  items: number;
}

export async function getGearCounts(): Promise<GearCounts> {
  const db = getDatabase();
  const [itemCount] = await db
    .select({ count: count() })
    .from(items)
    .where(eq(items.visibility, "public"));

  return {
    items: itemCount?.count ?? 0,
  };
}

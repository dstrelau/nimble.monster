import { asc } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import { sources } from "./schema";

export async function getAllSources() {
  const db = getDatabase();
  return db.select().from(sources).orderBy(asc(sources.name));
}

export async function createSource(data: {
  name: string;
  abbreviation: string;
  license: string;
  link: string;
}) {
  const db = getDatabase();
  const result = await db.insert(sources).values(data).returning();
  return result[0];
}

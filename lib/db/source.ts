import { asc, eq } from "drizzle-orm";
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

export async function updateSource(
  id: string,
  data: {
    name: string;
    abbreviation: string;
    license: string;
    link: string;
  }
) {
  const db = getDatabase();
  await db.update(sources).set(data).where(eq(sources.id, id));
}

export async function deleteSource(id: string) {
  const db = getDatabase();
  await db.delete(sources).where(eq(sources.id, id));
}

export async function findOrCreateSource(data: {
  name: string;
  abbreviation: string;
  license: string;
  link: string;
}): Promise<string> {
  const db = getDatabase();
  const existing = await db
    .select({ id: sources.id })
    .from(sources)
    .where(eq(sources.name, data.name))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const result = await db.insert(sources).values(data).returning();
  return result[0].id;
}

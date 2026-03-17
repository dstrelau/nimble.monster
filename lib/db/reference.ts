import { eq, sql } from "drizzle-orm";
import { getClient } from "./client";
import { getDatabase } from "./drizzle";
import { referenceEntries } from "./schema";

export async function listReferenceByCategory(category: string) {
  const db = getDatabase();
  return db
    .select({
      id: referenceEntries.id,
      slug: referenceEntries.slug,
      title: referenceEntries.title,
    })
    .from(referenceEntries)
    .where(eq(referenceEntries.category, category))
    .orderBy(referenceEntries.title);
}

export async function getReferenceEntry(slug: string) {
  const db = getDatabase();
  const results = await db
    .select()
    .from(referenceEntries)
    .where(eq(referenceEntries.slug, slug))
    .limit(1);
  return results[0] ?? null;
}

export interface ReferenceSearchResult {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
}

export async function searchReference(
  query: string
): Promise<ReferenceSearchResult[]> {
  const client = getClient();
  try {
    const result = await client.execute({
      sql: `
        SELECT
          r.slug,
          r.title,
          r.category,
          snippet(reference_entries_fts, 2, '<mark>', '</mark>', '…', 32) as excerpt
        FROM reference_entries_fts
        JOIN reference_entries r ON r.rowid = reference_entries_fts.rowid
        WHERE reference_entries_fts MATCH ?
        ORDER BY rank
        LIMIT 20
      `,
      args: [query],
    });

    return result.rows.map((row) => ({
      slug: String(row.slug),
      title: String(row.title),
      category: String(row.category),
      excerpt: String(row.excerpt),
    }));
  } catch {
    return [];
  }
}

export interface ReferenceIndexEntry {
  id: string;
  slug: string;
  title: string;
  category: string;
}

export async function listAllReferenceEntries(): Promise<
  ReferenceIndexEntry[]
> {
  const db = getDatabase();
  return db
    .select({
      id: referenceEntries.id,
      slug: referenceEntries.slug,
      title: referenceEntries.title,
      category: referenceEntries.category,
    })
    .from(referenceEntries)
    .orderBy(referenceEntries.category, referenceEntries.title);
}

export async function upsertReferenceEntry(entry: {
  slug: string;
  title: string;
  category: string;
  content: string;
  sourceFile: string;
  orderIndex: number;
}) {
  const db = getDatabase();
  await db
    .insert(referenceEntries)
    .values({
      id: crypto.randomUUID(),
      ...entry,
    })
    .onConflictDoUpdate({
      target: referenceEntries.slug,
      set: {
        title: sql`excluded.title`,
        category: sql`excluded.category`,
        content: sql`excluded.content`,
        sourceFile: sql`excluded.source_file`,
        orderIndex: sql`excluded.order_index`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

export async function deleteAllReferenceEntries() {
  const db = getDatabase();
  await db.delete(referenceEntries);
}

export async function rebuildReferenceSearchIndex() {
  const client = getClient();
  await client.execute(
    "INSERT INTO reference_entries_fts(reference_entries_fts) VALUES('rebuild')"
  );
}

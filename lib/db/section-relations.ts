import { and, eq, inArray, or } from "drizzle-orm";
import {
  groupRelatedBySection,
  type RelatedPair,
} from "../reference/relations";
import { getDatabase } from "./drizzle";
import { relations } from "./schema";

// Reserved id-triplet for a curated official section<->section "related" edge.
const SECTION = "section" as const;
const RELATED = "related" as const;

// Replace all curated section<->section `related` edges with `pairs`. Scoped
// tightly to (section, section, related) so live custom_rule->section rows are
// never touched. Each pair is stored as a single canonical row; render recovers
// symmetry by matching either endpoint. Idempotent.
export async function seedSectionRelations(
  pairs: RelatedPair[]
): Promise<void> {
  const db = getDatabase();
  await db.transaction(async (tx) => {
    await tx
      .delete(relations)
      .where(
        and(
          eq(relations.fromType, SECTION),
          eq(relations.toType, SECTION),
          eq(relations.relation, RELATED)
        )
      );
    if (pairs.length > 0) {
      await tx.insert(relations).values(
        pairs.map((p) => ({
          fromType: SECTION,
          fromId: p.from,
          toType: SECTION,
          toId: p.to,
          relation: RELATED,
        }))
      );
    }
  });
}

// For the sections rendered on one page, return a map of section slug -> related
// section slugs (both edge directions), sorted and de-duplicated. Empty map when
// no section has any edge.
export async function getRelatedSectionsByPage(
  sectionSlugs: string[]
): Promise<Map<string, string[]>> {
  if (sectionSlugs.length === 0) return new Map();
  const db = getDatabase();
  const rows = await db
    .select({ from: relations.fromId, to: relations.toId })
    .from(relations)
    .where(
      and(
        eq(relations.fromType, SECTION),
        eq(relations.toType, SECTION),
        eq(relations.relation, RELATED),
        or(
          inArray(relations.fromId, sectionSlugs),
          inArray(relations.toId, sectionSlugs)
        )
      )
    );
  return groupRelatedBySection(rows, sectionSlugs);
}

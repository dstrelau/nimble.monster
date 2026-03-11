/**
 * Backfill script: Populate subclasses.class_id from subclasses.class_name
 *
 * Matches subclass className to classes by name, preferring:
 *   1. Same owner (user_id match)
 *   2. Official class (OFFICIAL_USER_ID)
 *   3. Any unique public class
 *
 * Also backfills classes.subclass_name_preface from SUBCLASS_NAME_PREFIXES
 * for official classes that don't have one set yet.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx tools/backfill-subclass-class-id.ts
 */

import { and, eq, isNull } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { classes, subclasses } from "@/lib/db/schema";
import { SUBCLASS_NAME_PREFIXES, type SubclassClass } from "@/lib/types";

const OFFICIAL_USER_ID = "00000000-0000-0000-0000-000000000000";

async function backfill() {
  const db = getDatabase();

  // Step 1: Backfill subclass_name_preface on official classes
  const allClasses = await db
    .select({
      id: classes.id,
      name: classes.name,
      userId: classes.userId,
      subclassNamePreface: classes.subclassNamePreface,
    })
    .from(classes);

  let prefaceUpdates = 0;
  for (const cls of allClasses) {
    if (cls.userId === OFFICIAL_USER_ID && cls.subclassNamePreface === "") {
      const preface =
        SUBCLASS_NAME_PREFIXES[cls.name as SubclassClass] || "";
      if (preface) {
        await db
          .update(classes)
          .set({ subclassNamePreface: preface })
          .where(eq(classes.id, cls.id));
        prefaceUpdates++;
        console.log(`  Set preface for class "${cls.name}": "${preface}"`);
      }
    }
  }
  console.log(`Updated ${prefaceUpdates} class prefaces.`);

  // Step 2: Backfill class_id on subclasses
  const unlinkedSubclasses = await db
    .select({
      id: subclasses.id,
      className: subclasses.className,
      userId: subclasses.userId,
    })
    .from(subclasses)
    .where(isNull(subclasses.classId));

  console.log(
    `Found ${unlinkedSubclasses.length} subclasses without class_id.`
  );

  // Build lookup: className -> classes[]
  const classesByName = new Map<
    string,
    Array<{ id: string; userId: string }>
  >();
  for (const cls of allClasses) {
    const key = cls.name.toLowerCase();
    const existing = classesByName.get(key) || [];
    existing.push({ id: cls.id, userId: cls.userId });
    classesByName.set(key, existing);
  }

  let linked = 0;
  let ambiguous = 0;
  let unmatched = 0;

  for (const sc of unlinkedSubclasses) {
    const candidates = classesByName.get(sc.className.toLowerCase()) || [];

    if (candidates.length === 0) {
      unmatched++;
      console.log(`  No match: subclass "${sc.className}" (${sc.id})`);
      continue;
    }

    // Prefer: same owner > official > unique public
    let match =
      candidates.find((c) => c.userId === sc.userId) ||
      candidates.find((c) => c.userId === OFFICIAL_USER_ID);

    if (!match && candidates.length === 1) {
      match = candidates[0];
    }

    if (match) {
      await db
        .update(subclasses)
        .set({ classId: match.id })
        .where(
          and(eq(subclasses.id, sc.id), isNull(subclasses.classId))
        );
      linked++;
    } else {
      ambiguous++;
      console.log(
        `  Ambiguous: subclass "${sc.className}" (${sc.id}) - ${candidates.length} candidates`
      );
    }
  }

  console.log(
    `\nResults: ${linked} linked, ${ambiguous} ambiguous, ${unmatched} unmatched`
  );
}

backfill()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });

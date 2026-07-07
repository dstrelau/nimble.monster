import { count, eq } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import {
  ancestries,
  backgrounds,
  classes,
  spellSchools,
  subclasses,
} from "./schema";

export interface CharacterOptionCounts {
  ancestries: number;
  backgrounds: number;
  classes: number;
  subclasses: number;
  spellSchools: number;
}

export async function getCharacterOptionCounts(): Promise<CharacterOptionCounts> {
  const db = getDatabase();
  const [
    ancestryCount,
    backgroundCount,
    classCount,
    subclassCount,
    schoolCount,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(ancestries)
      .where(eq(ancestries.visibility, "public")),
    db
      .select({ count: count() })
      .from(backgrounds)
      .where(eq(backgrounds.visibility, "public")),
    db
      .select({ count: count() })
      .from(classes)
      .where(eq(classes.visibility, "public")),
    db
      .select({ count: count() })
      .from(subclasses)
      .where(eq(subclasses.visibility, "public")),
    db
      .select({ count: count() })
      .from(spellSchools)
      .where(eq(spellSchools.visibility, "public")),
  ]);

  return {
    ancestries: ancestryCount[0]?.count ?? 0,
    backgrounds: backgroundCount[0]?.count ?? 0,
    classes: classCount[0]?.count ?? 0,
    subclasses: subclassCount[0]?.count ?? 0,
    spellSchools: schoolCount[0]?.count ?? 0,
  };
}

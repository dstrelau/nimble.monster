import { count, eq } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import {
  ancestries,
  backgrounds,
  classes,
  collections,
  companions,
  encounters,
  families,
  items,
  monsters,
  spellSchools,
  subclasses,
} from "./schema";

export interface MyLibraryCounts {
  monsters: number;
  ancestries: number;
  companions: number;
  backgrounds: number;
  items: number;
  classes: number;
  collections: number;
  encounters: number;
  subclasses: number;
  families: number;
  "spell-schools": number;
}

export async function getMyLibraryCounts(
  userId: string
): Promise<MyLibraryCounts> {
  const db = getDatabase();
  const [
    monsterCount,
    ancestryCount,
    companionCount,
    backgroundCount,
    itemCount,
    classCount,
    collectionCount,
    encounterCount,
    subclassCount,
    familyCount,
    schoolCount,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(monsters)
      .where(eq(monsters.userId, userId)),
    db
      .select({ count: count() })
      .from(ancestries)
      .where(eq(ancestries.userId, userId)),
    db
      .select({ count: count() })
      .from(companions)
      .where(eq(companions.userId, userId)),
    db
      .select({ count: count() })
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId)),
    db.select({ count: count() }).from(items).where(eq(items.userId, userId)),
    db
      .select({ count: count() })
      .from(classes)
      .where(eq(classes.userId, userId)),
    db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.creatorId, userId)),
    db
      .select({ count: count() })
      .from(encounters)
      .where(eq(encounters.creatorId, userId)),
    db
      .select({ count: count() })
      .from(subclasses)
      .where(eq(subclasses.userId, userId)),
    db
      .select({ count: count() })
      .from(families)
      .where(eq(families.creatorId, userId)),
    db
      .select({ count: count() })
      .from(spellSchools)
      .where(eq(spellSchools.userId, userId)),
  ]);

  return {
    monsters: monsterCount[0]?.count ?? 0,
    ancestries: ancestryCount[0]?.count ?? 0,
    companions: companionCount[0]?.count ?? 0,
    backgrounds: backgroundCount[0]?.count ?? 0,
    items: itemCount[0]?.count ?? 0,
    classes: classCount[0]?.count ?? 0,
    collections: collectionCount[0]?.count ?? 0,
    encounters: encounterCount[0]?.count ?? 0,
    subclasses: subclassCount[0]?.count ?? 0,
    families: familyCount[0]?.count ?? 0,
    "spell-schools": schoolCount[0]?.count ?? 0,
  };
}

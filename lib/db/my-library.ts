import { and, count, eq } from "drizzle-orm";
import { getDatabase } from "./drizzle";
import {
  ancestries,
  backgrounds,
  classes,
  collections,
  companions,
  customRules,
  encounters,
  families,
  items,
  monsters,
  spellSchools,
  subclasses,
} from "./schema";

export interface MyLibraryCounts {
  monsters: number;
  rules: number;
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
    ruleCount,
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
      .from(customRules)
      .where(eq(customRules.userId, userId)),
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
    rules: ruleCount[0]?.count ?? 0,
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

export async function getPublicLibraryCounts(
  userId: string
): Promise<MyLibraryCounts> {
  const db = getDatabase();
  const [
    monsterCount,
    ruleCount,
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
      .where(
        and(eq(monsters.userId, userId), eq(monsters.visibility, "public"))
      ),
    db
      .select({ count: count() })
      .from(customRules)
      .where(
        and(
          eq(customRules.userId, userId),
          eq(customRules.visibility, "public")
        )
      ),
    db
      .select({ count: count() })
      .from(ancestries)
      .where(
        and(eq(ancestries.userId, userId), eq(ancestries.visibility, "public"))
      ),
    db
      .select({ count: count() })
      .from(companions)
      .where(
        and(eq(companions.userId, userId), eq(companions.visibility, "public"))
      ),
    db
      .select({ count: count() })
      .from(backgrounds)
      .where(
        and(
          eq(backgrounds.userId, userId),
          eq(backgrounds.visibility, "public")
        )
      ),
    db
      .select({ count: count() })
      .from(items)
      .where(and(eq(items.userId, userId), eq(items.visibility, "public"))),
    db
      .select({ count: count() })
      .from(classes)
      .where(and(eq(classes.userId, userId), eq(classes.visibility, "public"))),
    db
      .select({ count: count() })
      .from(collections)
      .where(
        and(
          eq(collections.creatorId, userId),
          eq(collections.visibility, "public")
        )
      ),
    db
      .select({ count: count() })
      .from(encounters)
      .where(
        and(
          eq(encounters.creatorId, userId),
          eq(encounters.visibility, "public")
        )
      ),
    db
      .select({ count: count() })
      .from(subclasses)
      .where(
        and(eq(subclasses.userId, userId), eq(subclasses.visibility, "public"))
      ),
    db
      .select({ count: count() })
      .from(families)
      .where(
        and(eq(families.creatorId, userId), eq(families.visibility, "public"))
      ),
    db
      .select({ count: count() })
      .from(spellSchools)
      .where(
        and(
          eq(spellSchools.userId, userId),
          eq(spellSchools.visibility, "public")
        )
      ),
  ]);

  return {
    monsters: monsterCount[0]?.count ?? 0,
    rules: ruleCount[0]?.count ?? 0,
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

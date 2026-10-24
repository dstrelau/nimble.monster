import { and, count, eq } from "drizzle-orm";
import {
  type MonsterArtwork,
  monsterArtworkSchema,
} from "@/lib/monster-artwork";
import {
  getAdventureUrl,
  getAncestryUrl,
  getBackgroundUrl,
  getClassUrl,
  getCollectionUrl,
  getCompanionUrl,
  getCustomRuleUrl,
  getEncounterUrl,
  getFamilyUrl,
  getItemUrl,
  getMonsterUrl,
  getRandomTableUrl,
  getSpellSchoolUrl,
  getSubclassUrl,
} from "@/lib/utils/url";
import { getClient } from "./client";
import { getDatabase } from "./drizzle";
import {
  adventures,
  ancestries,
  backgrounds,
  classes,
  collections,
  companions,
  conditions,
  customRules,
  encounters,
  families,
  items,
  monsters,
  randomTables,
  spellSchools,
  subclasses,
} from "./schema";

export interface MyLibraryCounts {
  conditions: number;
  monsters: number;
  hazards: number;
  rules: number;
  ancestries: number;
  companions: number;
  backgrounds: number;
  items: number;
  classes: number;
  collections: number;
  encounters: number;
  adventures: number;
  "random-tables": number;
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
    hazardCount,
    ruleCount,
    ancestryCount,
    companionCount,
    backgroundCount,
    itemCount,
    classCount,
    collectionCount,
    encounterCount,
    adventureCount,
    randomTableCount,
    subclassCount,
    familyCount,
    schoolCount,
    conditionCount,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(monsters)
      .where(and(eq(monsters.userId, userId), eq(monsters.hazard, false))),
    db
      .select({ count: count() })
      .from(monsters)
      .where(and(eq(monsters.userId, userId), eq(monsters.hazard, true))),
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
      .from(adventures)
      .where(eq(adventures.userId, userId)),
    db
      .select({ count: count() })
      .from(randomTables)
      .where(eq(randomTables.creatorId, userId)),
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
    db
      .select({ count: count() })
      .from(conditions)
      .where(eq(conditions.creatorId, userId)),
  ]);

  return {
    conditions: conditionCount[0]?.count ?? 0,
    monsters: monsterCount[0]?.count ?? 0,
    hazards: hazardCount[0]?.count ?? 0,
    rules: ruleCount[0]?.count ?? 0,
    ancestries: ancestryCount[0]?.count ?? 0,
    companions: companionCount[0]?.count ?? 0,
    backgrounds: backgroundCount[0]?.count ?? 0,
    items: itemCount[0]?.count ?? 0,
    classes: classCount[0]?.count ?? 0,
    collections: collectionCount[0]?.count ?? 0,
    encounters: encounterCount[0]?.count ?? 0,
    adventures: adventureCount[0]?.count ?? 0,
    "random-tables": randomTableCount[0]?.count ?? 0,
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
    hazardCount,
    ruleCount,
    ancestryCount,
    companionCount,
    backgroundCount,
    itemCount,
    classCount,
    collectionCount,
    encounterCount,
    adventureCount,
    subclassCount,
    familyCount,
    schoolCount,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(monsters)
      .where(
        and(
          eq(monsters.userId, userId),
          eq(monsters.visibility, "public"),
          eq(monsters.hazard, false)
        )
      ),
    db
      .select({ count: count() })
      .from(monsters)
      .where(
        and(
          eq(monsters.userId, userId),
          eq(monsters.visibility, "public"),
          eq(monsters.hazard, true)
        )
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
      .from(adventures)
      .where(
        and(eq(adventures.userId, userId), eq(adventures.visibility, "public"))
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
    conditions: 0,
    monsters: monsterCount[0]?.count ?? 0,
    hazards: hazardCount[0]?.count ?? 0,
    rules: ruleCount[0]?.count ?? 0,
    ancestries: ancestryCount[0]?.count ?? 0,
    companions: companionCount[0]?.count ?? 0,
    backgrounds: backgroundCount[0]?.count ?? 0,
    items: itemCount[0]?.count ?? 0,
    classes: classCount[0]?.count ?? 0,
    collections: collectionCount[0]?.count ?? 0,
    encounters: encounterCount[0]?.count ?? 0,
    adventures: adventureCount[0]?.count ?? 0,
    "random-tables": 0,
    subclasses: subclassCount[0]?.count ?? 0,
    families: familyCount[0]?.count ?? 0,
    "spell-schools": schoolCount[0]?.count ?? 0,
  };
}

export type MyLibraryEntryKey = keyof MyLibraryCounts;

export interface MyLibraryEntry {
  key: MyLibraryEntryKey;
  id: string;
  name: string;
  href: string;
  visibility?: "public" | "private" | "secret";
  createdAt: string | null;
  paperforgeId?: string;
  customArtwork?: MonsterArtwork;
  imageIcon?: string;
}

interface MyLibraryEntrySource {
  key: MyLibraryEntryKey;
  table: string;
  ownerColumn: string;
  href: (entity: { id: string; name: string; namePreface?: string }) => string;
}

const MY_LIBRARY_ENTRY_SOURCES: MyLibraryEntrySource[] = [
  {
    key: "monsters",
    table: "monsters",
    ownerColumn: "user_id",
    href: getMonsterUrl,
  },
  {
    key: "hazards",
    table: "monsters",
    ownerColumn: "user_id",
    href: (entity) => getMonsterUrl({ ...entity, hazard: true }),
  },
  {
    key: "companions",
    table: "companions",
    ownerColumn: "user_id",
    href: getCompanionUrl,
  },
  {
    key: "families",
    table: "families",
    ownerColumn: "user_id",
    href: getFamilyUrl,
  },
  {
    key: "ancestries",
    table: "ancestries",
    ownerColumn: "user_id",
    href: getAncestryUrl,
  },
  {
    key: "backgrounds",
    table: "backgrounds",
    ownerColumn: "user_id",
    href: getBackgroundUrl,
  },
  {
    key: "classes",
    table: "classes",
    ownerColumn: "user_id",
    href: getClassUrl,
  },
  {
    key: "subclasses",
    table: "subclasses",
    ownerColumn: "user_id",
    href: getSubclassUrl,
  },
  {
    key: "spell-schools",
    table: "spell_schools",
    ownerColumn: "user_id",
    href: getSpellSchoolUrl,
  },
  { key: "items", table: "items", ownerColumn: "user_id", href: getItemUrl },
  {
    key: "adventures",
    table: "adventures",
    ownerColumn: "user_id",
    href: getAdventureUrl,
  },
  {
    key: "encounters",
    table: "encounters",
    ownerColumn: "user_id",
    href: getEncounterUrl,
  },
  {
    key: "rules",
    table: "custom_rules",
    ownerColumn: "user_id",
    href: getCustomRuleUrl,
  },
  {
    key: "random-tables",
    table: "random_tables",
    ownerColumn: "user_id",
    href: getRandomTableUrl,
  },
  {
    key: "conditions",
    table: "conditions",
    ownerColumn: "creator_id",
    href: () => "/my/conditions",
  },
  {
    key: "collections",
    table: "collections",
    ownerColumn: "user_id",
    href: getCollectionUrl,
  },
];

function sourceSelect(source: MyLibraryEntrySource, filterName: boolean) {
  const where = [`${source.ownerColumn} = ?`];
  if (source.key === "monsters") where.push("hazard = 0");
  if (source.key === "hazards") where.push("hazard = 1");
  if (filterName) where.push("name LIKE ? ESCAPE '\\'");
  return `
    SELECT
      '${source.key}' AS entry_key,
      id,
      name,
      ${source.key === "subclasses" ? "name_preface" : "NULL"} AS name_preface,
      ${source.key === "conditions" ? "NULL" : "COALESCE(visibility, 'public')"} AS visibility,
      ${["monsters", "hazards", "companions"].includes(source.key) ? "paperforge_id" : "NULL"} AS paperforge_id,
      ${source.table === "monsters" ? "custom_artwork" : "NULL"} AS custom_artwork,
      ${source.key === "items" ? "image_icon" : "NULL"} AS image_icon,
      strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at
    FROM ${source.table}
    WHERE ${where.join(" AND ")}
  `;
}

/** The user's most recently created library entries, optionally filtered by name. */
export async function listMyLibraryEntries(
  userId: string,
  { query = "", limit = 20 }: { query?: string; limit?: number } = {}
): Promise<MyLibraryEntry[]> {
  const trimmedQuery = query.trim();
  const pattern = `%${trimmedQuery.replace(/[\\%_]/g, "\\$&")}%`;
  const args = MY_LIBRARY_ENTRY_SOURCES.flatMap(() =>
    trimmedQuery ? [userId, pattern] : [userId]
  );
  const result = await getClient().execute({
    sql: `
      ${MY_LIBRARY_ENTRY_SOURCES.map((source) => sourceSelect(source, Boolean(trimmedQuery))).join(" UNION ALL ")}
      ORDER BY created_at DESC, entry_key ASC, id ASC
      LIMIT ?
    `,
    args: [...args, limit],
  });

  return result.rows.flatMap((row) => {
    const source = MY_LIBRARY_ENTRY_SOURCES.find(
      (candidate) => candidate.key === row.entry_key
    );
    if (!source) return [];
    const id = String(row.id);
    const name = String(row.name);
    const namePreface =
      typeof row.name_preface === "string" && row.name_preface
        ? row.name_preface
        : undefined;
    return [
      {
        key: source.key,
        id,
        name,
        href: source.href({ id, name, namePreface }),
        ...(row.visibility === "public" ||
        row.visibility === "private" ||
        row.visibility === "secret"
          ? { visibility: row.visibility }
          : {}),
        createdAt: typeof row.created_at === "string" ? row.created_at : null,
        ...(typeof row.paperforge_id === "string" && row.paperforge_id
          ? { paperforgeId: row.paperforge_id }
          : {}),
        ...(typeof row.custom_artwork === "string" && row.custom_artwork
          ? {
              customArtwork: monsterArtworkSchema.parse(
                JSON.parse(row.custom_artwork)
              ),
            }
          : {}),
        ...(typeof row.image_icon === "string" && row.image_icon
          ? { imageIcon: row.image_icon }
          : {}),
      },
    ];
  });
}

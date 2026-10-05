import { and, asc, eq, ne } from "drizzle-orm";
import type { Metadata } from "next";
import { getDatabase } from "@/lib/db/drizzle";
import {
  adventures,
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
  randomTables,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";
import { ENTITY_TYPE_PATHS } from "@/lib/types/entity-links";
import { slugify } from "@/lib/utils/slug";
import { EntityReferencesLab } from "./EntityReferencesLab";
import { MISSING_ID, type ReferenceExample } from "./fixtures";

export const metadata: Metadata = {
  title: "Entity References Dev Lab",
  robots: { index: false, follow: false },
};

const sources = [
  { type: "monster", label: "Monsters", table: monsters },
  { type: "item", label: "Items", table: items },
  { type: "companion", label: "Companions", table: companions },
  { type: "family", label: "Families", table: families },
  { type: "collection", label: "Collections", table: collections },
  { type: "school", label: "Spell schools", table: spellSchools },
  { type: "class", label: "Classes", table: classes },
  { type: "subclass", label: "Subclasses", table: subclasses },
  { type: "ancestry", label: "Ancestries", table: ancestries },
  { type: "background", label: "Backgrounds", table: backgrounds },
  { type: "rule", label: "Custom rules", table: customRules },
  { type: "adventure", label: "Adventures", table: adventures },
  { type: "encounter", label: "Encounters", table: encounters },
  { type: "table", label: "Tables", table: randomTables },
] as const;

export default async function EntityReferencesPage() {
  const db = getDatabase();
  const examples: ReferenceExample[] = await Promise.all(
    sources.map(async ({ type, label, table }) => {
      const [publicContent] = await db
        .select({ id: table.id, name: table.name })
        .from(table)
        .where(
          and(
            eq(table.visibility, "public"),
            type === "monster" ? eq(monsters.hazard, false) : undefined
          )
        )
        .orderBy(asc(table.name))
        .limit(1);
      // Only IDs leave the server for nonpublic cases, never their names/content.
      const [nonpublic] = await db
        .select({ id: table.id })
        .from(table)
        .where(ne(table.visibility, "public"))
        .orderBy(asc(table.id))
        .limit(1);
      const content = publicContent ?? {
        id: MISSING_ID,
        name: "missing-content",
      };
      return {
        key: type,
        label,
        type,
        id: content.id,
        url: `https://nimble.nexus/${ENTITY_TYPE_PATHS[type]}/${slugify(content)}`,
        available: Boolean(publicContent),
        privateId: nonpublic?.id,
      };
    })
  );
  const [hazard] = await db
    .select({ id: monsters.id, name: monsters.name })
    .from(monsters)
    .where(and(eq(monsters.visibility, "public"), eq(monsters.hazard, true)))
    .orderBy(asc(monsters.name))
    .limit(1);
  examples.push(
    {
      key: "hazard",
      label: "Hazards",
      type: "monster",
      id: hazard?.id ?? MISSING_ID,
      url: `https://nimble.nexus/hazards/${slugify(hazard ?? { id: MISSING_ID, name: "missing-content" })}`,
      available: Boolean(hazard),
    },
    {
      key: "official-rule",
      label: "Official rules",
      type: "rule",
      id: "conditions",
      url: "https://nimble.nexus/rules/conditions",
      available: true,
    },
    {
      key: "rule-variant",
      label: "Rule variants",
      type: "rule",
      id: "playing-dead",
      url: "https://nimble.nexus/rules/conditions#variant-playing-dead",
      available: true,
    }
  );
  return <EntityReferencesLab examples={examples} />;
}

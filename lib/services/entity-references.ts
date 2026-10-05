import { and, eq, inArray } from "drizzle-orm";
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
import { getRule } from "@/lib/rules/filesystem";
import { ruleUrl, variantParentUrl } from "@/lib/rules/rule-index";
import type {
  EntityReference,
  EntityReferenceRequest,
  EntityType,
} from "@/lib/types/entity-links";
import { deslugify } from "@/lib/utils/slug";
import { getMonsterUrl } from "@/lib/utils/url";

const tables = {
  monster: monsters,
  item: items,
  companion: companions,
  family: families,
  collection: collections,
  school: spellSchools,
  class: classes,
  subclass: subclasses,
  ancestry: ancestries,
  background: backgrounds,
  rule: customRules,
  adventure: adventures,
  encounter: encounters,
  table: randomTables,
};

// Reference names never need full entities, relationships, or owner access.
export async function resolveEntityReferences(
  requests: readonly EntityReferenceRequest[]
): Promise<EntityReference[]> {
  const resolved = new Map<string, EntityReference>();
  const groups = new Map<EntityType, Set<string>>();
  for (const { type, id } of requests) {
    if (type === "rule") {
      const rule = getRule(id);
      if (rule) {
        resolved.set(`${type}:${rule.slug}`, {
          id: rule.slug,
          name: rule.title,
          type,
          href: rule.variantOf
            ? variantParentUrl(rule.variantOf, rule.slug)
            : ruleUrl(rule.slug),
        });
        continue;
      }
    }
    const uuid = deslugify(id)?.toLowerCase();
    if (!uuid) continue;
    const ids = groups.get(type) ?? new Set<string>();
    ids.add(uuid);
    groups.set(type, ids);
  }

  const db = getDatabase();
  await Promise.all(
    Array.from(groups, async ([type, ids]) => {
      if (type === "monster") {
        const rows = await db
          .select({
            id: monsters.id,
            name: monsters.name,
            hazard: monsters.hazard,
          })
          .from(monsters)
          .where(
            and(
              inArray(monsters.id, [...ids]),
              eq(monsters.visibility, "public")
            )
          );
        for (const row of rows) {
          resolved.set(`${type}:${row.id}`, {
            id: row.id,
            name: row.name,
            type,
            href: getMonsterUrl(row),
          });
        }
      } else {
        const table = tables[type];
        const rows = await db
          .select({ id: table.id, name: table.name })
          .from(table)
          .where(
            and(inArray(table.id, [...ids]), eq(table.visibility, "public"))
          );
        for (const row of rows) {
          resolved.set(`${type}:${row.id}`, { ...row, type });
        }
      }
    })
  );
  return [...resolved.values()];
}

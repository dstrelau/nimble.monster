"use server";

import { and, eq } from "drizzle-orm";
import { findPublicClassById } from "@/lib/db/class";
import { getCollection } from "@/lib/db/collection";
import { findPublicCompanionById } from "@/lib/db/companion";
import { findPublicCustomRule } from "@/lib/db/custom-rule";
import { getDatabase } from "@/lib/db/drizzle";
import { getPublicEncounterById } from "@/lib/db/encounter";
import { getPublicRandomTableById } from "@/lib/db/random-table";
import { adventures, ancestries, backgrounds, families } from "@/lib/db/schema";
import { findPublicSpellSchoolById } from "@/lib/db/school";
import { findPublicSubclassById } from "@/lib/db/subclass";
import { getRule } from "@/lib/rules/filesystem";
import { ruleUrl, variantParentUrl } from "@/lib/rules/rule-index";
import { itemsService } from "@/lib/services/items";
import { monstersService } from "@/lib/services/monsters";
import type { EntityReference, EntityType } from "@/lib/types/entity-links";
import { deslugify } from "@/lib/utils/slug";
import { getMonsterUrl } from "@/lib/utils/url";

export async function getEntityById(
  type: EntityType,
  id: string
): Promise<EntityReference | null> {
  try {
    if (type === "rule") {
      const officialRule = getRule(id);
      if (officialRule) {
        return {
          id: officialRule.slug,
          name: officialRule.title,
          type,
          href: officialRule.variantOf
            ? variantParentUrl(officialRule.variantOf, officialRule.slug)
            : ruleUrl(officialRule.slug),
        };
      }
    }

    // Convert base32 identifier to UUID
    const uuid = deslugify(id);
    if (!uuid) return null;

    let entity: { id: string; name: string } | null = null;
    let href: string | undefined;

    switch (type) {
      case "monster": {
        const monster = await monstersService.getPublicBestiaryEntry(uuid);
        entity = monster;
        if (monster) href = getMonsterUrl(monster);
        break;
      }
      case "item":
        entity = await itemsService.getPublicItem(uuid);
        break;
      case "companion":
        entity = await findPublicCompanionById(uuid);
        break;
      case "collection":
        entity = await getCollection(uuid);
        break;
      case "school":
        entity = await findPublicSpellSchoolById(uuid);
        break;
      case "class":
        entity = await findPublicClassById(uuid);
        break;
      case "subclass":
        entity = await findPublicSubclassById(uuid);
        break;
      case "rule":
        entity = await findPublicCustomRule(uuid);
        break;
      case "family":
      case "ancestry":
      case "background":
      case "adventure": {
        // These detail loaders are not public-only (some allow owner access).
        // Mentions need only metadata and must never expose nonpublic names.
        const table = {
          family: families,
          ancestry: ancestries,
          background: backgrounds,
          adventure: adventures,
        }[type];
        const [result] = await getDatabase()
          .select({ id: table.id, name: table.name })
          .from(table)
          .where(and(eq(table.id, uuid), eq(table.visibility, "public")))
          .limit(1);
        entity = result ?? null;
        break;
      }
      case "encounter":
        entity = await getPublicEncounterById(uuid);
        break;
      case "table":
        entity = await getPublicRandomTableById(uuid);
        break;
    }

    if (!entity) return null;

    return {
      id: entity.id,
      name: entity.name,
      type,
      ...(href ? { href } : {}),
    };
  } catch (error) {
    console.error(`Error fetching ${type} with id ${id}:`, error);
    return null;
  }
}

export async function getEntitiesByIds(
  requests: Array<{ type: EntityType; id: string }>
): Promise<EntityReference[]> {
  const results = await Promise.all(
    requests.map((req) => getEntityById(req.type, req.id))
  );
  return results.filter((r): r is EntityReference => r !== null);
}

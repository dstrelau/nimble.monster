"use server";

import { getCollection } from "@/lib/db/collection";
import { findPublicCompanionById } from "@/lib/db/companion";
import { getFamily } from "@/lib/db/family";
import { findSpellSchool } from "@/lib/db/school";
import { findPublicSubclassById } from "@/lib/db/subclass";
import { ancestriesService } from "@/lib/services/ancestries";
import { backgroundsService } from "@/lib/services/backgrounds";
import { itemsService } from "@/lib/services/items";
import { monstersService } from "@/lib/services/monsters";
import type { EntityReference, EntityType } from "@/lib/types/entity-links";
import { deslugify } from "@/lib/utils/slug";

export async function getEntityById(
  type: EntityType,
  id: string
): Promise<EntityReference | null> {
  try {
    // Convert base32 identifier to UUID
    const uuid = deslugify(id);
    if (!uuid) return null;

    let entity: { id: string; name: string } | null = null;

    switch (type) {
      case "monster":
        entity = await monstersService.getPublicMonster(uuid);
        break;
      case "item":
        entity = await itemsService.getPublicItem(uuid);
        break;
      case "companion":
        entity = await findPublicCompanionById(uuid);
        break;
      case "family":
        entity = await getFamily(uuid);
        break;
      case "collection":
        entity = await getCollection(uuid);
        break;
      case "school":
        entity = await findSpellSchool(uuid);
        break;
      case "subclass":
        entity = await findPublicSubclassById(uuid);
        break;
      case "ancestry":
        entity = await ancestriesService.getAncestry(uuid);
        break;
      case "background":
        entity = await backgroundsService.getBackground(uuid);
        break;
    }

    if (!entity) return null;

    return {
      id: entity.id,
      name: entity.name,
      type,
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

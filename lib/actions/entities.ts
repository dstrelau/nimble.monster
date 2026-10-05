"use server";

import { resolveEntityReferences } from "@/lib/services/entity-references";
import type { EntityReference, EntityType } from "@/lib/types/entity-links";

export async function getEntityById(
  type: EntityType,
  id: string
): Promise<EntityReference | null> {
  const [reference] = await resolveEntityReferences([{ type, id }]);
  return reference ?? null;
}

export async function getEntitiesByIds(
  requests: Array<{ type: EntityType; id: string }>
): Promise<EntityReference[]> {
  return resolveEntityReferences(requests);
}

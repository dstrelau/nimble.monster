"use server";

import { listAllSources, listSourcesForEntityType } from "./repository";
import type { EntityType } from "./types";

export const getAllSources = async () => {
  return listAllSources();
};

export const getSourcesForEntityType = async (entityType: EntityType) => {
  return listSourcesForEntityType(entityType);
};

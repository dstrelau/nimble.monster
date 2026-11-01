"use server";

import type { ListCollectionsParams } from "./queries";
import * as queries from "./queries";

export async function listPublicCollections(params: ListCollectionsParams) {
  return queries.listPublicCollections(params);
}

export async function findPublicCollectionById(id: string) {
  return queries.findPublicCollectionById(id);
}

"use server";

import {
  type PaginateHazardsParams,
  paginatePublicHazards as paginatePublicHazardsService,
} from "@/lib/services/hazards";

export async function paginatePublicHazards(params: PaginateHazardsParams) {
  return paginatePublicHazardsService(params);
}

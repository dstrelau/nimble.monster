"use server";

import { ancestriesService } from "@/lib/services/ancestries";
import type { PaginateAncestriesParams } from "@/lib/services/ancestries/service";

export const paginatePublicAncestries = async (
  params: PaginateAncestriesParams
) => {
  return ancestriesService.paginatePublicAncestries(params);
};

"use server";

import { isOfficialOnlyDomain } from "@/lib/domain";
import { ancestriesService } from "@/lib/services/ancestries";
import type { PaginateAncestriesParams } from "@/lib/services/ancestries/service";

export const paginatePublicAncestries = async (
  params: PaginateAncestriesParams
) => {
  const officialOnly = await isOfficialOnlyDomain();
  return ancestriesService.paginatePublicAncestries(params, officialOnly);
};

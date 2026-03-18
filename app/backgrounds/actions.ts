"use server";

import { isOfficialOnlyDomain } from "@/lib/domain";
import { backgroundsService } from "@/lib/services/backgrounds";
import type { PaginateBackgroundsParams } from "@/lib/services/backgrounds/service";

export const paginatePublicBackgrounds = async (
  params: PaginateBackgroundsParams
) => {
  const officialOnly = await isOfficialOnlyDomain();
  return backgroundsService.paginatePublicBackgrounds(params, officialOnly);
};

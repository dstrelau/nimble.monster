"use server";

import { backgroundsService } from "@/lib/services/backgrounds";
import type { PaginateBackgroundsParams } from "@/lib/services/backgrounds/service";

export const paginatePublicBackgrounds = async (
  params: PaginateBackgroundsParams
) => {
  return backgroundsService.paginatePublicBackgrounds(params);
};

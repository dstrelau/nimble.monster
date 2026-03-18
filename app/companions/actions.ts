"use server";

import { isOfficialOnlyDomain } from "@/lib/domain";
import { paginatePublicCompanions } from "@/lib/services/companions";
import type { PaginateMonstersParams } from "@/lib/services/companions/types";

export const paginatePublicCompanionsAction = async (
  params: PaginateMonstersParams
) => {
  const officialOnly = await isOfficialOnlyDomain();
  return paginatePublicCompanions({ ...params, officialOnly });
};

"use server";

import { paginatePublicCompanions } from "@/lib/services/companions";
import type { PaginateMonstersParams } from "@/lib/services/companions/types";

export const paginatePublicCompanionsAction = async (
  params: PaginateMonstersParams
) => {
  return paginatePublicCompanions(params);
};

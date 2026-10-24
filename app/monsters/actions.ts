"use server";

import { monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";

export const paginatePublicMonsters = async (
  params: PaginateMonstersParams
) => {
  return monstersService.paginatePublicMonsters(params);
};

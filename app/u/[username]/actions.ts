"use server";

import {
  type PaginateHazardsParams,
  paginatePublicHazards,
} from "@/lib/services/hazards";
import { monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";

export const paginateUserProfileMonsters = async (
  params: PaginateMonstersParams
) => {
  return monstersService.paginatePublicMonsters(params);
};

export const paginateUserProfileHazards = async (
  params: PaginateHazardsParams
) => paginatePublicHazards(params);

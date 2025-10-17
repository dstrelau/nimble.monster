"use server";

import { listAllSources, monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";

export const listAllMonsterSources = async () => listAllSources();

export const paginatePublicMonsters = async (params: PaginateMonstersParams) =>
  monstersService.paginatePublicMonsters(params);

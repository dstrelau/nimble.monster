"use server";

import { auth } from "@/lib/auth";
import { isOfficialOnlyDomain } from "@/lib/domain";
import { listAllSources, monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";
import type { UpdateMonsterInput } from "@/lib/services/monsters/types";

export const listAllMonsterSources = async () => listAllSources();

export const paginatePublicMonsters = async (
  params: PaginateMonstersParams
) => {
  const officialOnly = await isOfficialOnlyDomain();
  return monstersService.paginatePublicMonsters(params, officialOnly);
};

export async function updateMonster(input: UpdateMonsterInput) {
  const session = await auth();
  if (!session?.user?.discordId) {
    throw new Error("Unauthorized");
  }

  return monstersService.updateMonster(input, session.user.discordId);
}

export const getPublicMonster = async (id: string) => {
  const officialOnly = await isOfficialOnlyDomain();
  return monstersService.getPublicMonster(id, officialOnly);
};

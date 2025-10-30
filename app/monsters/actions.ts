"use server";

import { auth } from "@/lib/auth";
import { listAllSources, monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";
import type { UpdateMonsterInput } from "@/lib/services/monsters/types";

export const listAllMonsterSources = async () => listAllSources();

export const paginatePublicMonsters = async (
  params: PaginateMonstersParams
) => {
  return monstersService.paginatePublicMonsters(params);
};

export async function updateMonster(input: UpdateMonsterInput) {
  const session = await auth();
  if (!session?.user?.discordId) {
    throw new Error("Unauthorized");
  }

  return monstersService.updateMonster(input, session.user.discordId);
}

"use server";

import { auth } from "@/lib/auth";
import { deleteHazard as deleteHazardService } from "@/lib/services/hazards";
import { listAllSources, monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";

export const listAllMonsterSources = async () => listAllSources();

export const paginatePublicMonsters = async (
  params: PaginateMonstersParams
) => {
  return monstersService.paginatePublicMonsters(params);
};

export async function deleteHazard(id: string) {
  const session = await auth();
  if (!session?.user?.discordId) throw new Error("Unauthorized");
  const deleted = await deleteHazardService(id, session.user.discordId);
  return {
    success: deleted,
    error: deleted ? null : "Could not delete the hazard. Please try again.",
  };
}

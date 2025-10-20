"use server";

import { auth } from "@/lib/auth";
import { monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";

export const paginateMyMonsters = async (
  params: Omit<PaginateMonstersParams, "creatorId">
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return monstersService.paginatePublicMonsters({
    ...params,
    creatorId: session.user.id,
  });
};

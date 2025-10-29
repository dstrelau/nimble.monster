"use server";

import { auth } from "@/lib/auth";
import { classAbilityListsService } from "@/lib/services/classAbilityLists";
import type { PaginateClassAbilityListsParams } from "@/lib/services/classAbilityLists/service";

export const paginateMyClassAbilityLists = async (
  params: Omit<PaginateClassAbilityListsParams, "creatorId">
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return classAbilityListsService.paginatePublicClassAbilityLists({
    ...params,
    creatorId: session.user.id,
  });
};

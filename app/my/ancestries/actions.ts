"use server";

import { auth } from "@/lib/auth";
import { ancestriesService } from "@/lib/services/ancestries";
import type { PaginateAncestriesParams } from "@/lib/services/ancestries/service";

export const paginateMyAncestries = async (
  params: Omit<PaginateAncestriesParams, "creatorId">
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return ancestriesService.paginatePublicAncestries({
    ...params,
    creatorId: session.user.id,
  });
};

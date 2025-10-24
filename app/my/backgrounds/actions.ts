"use server";

import { auth } from "@/lib/auth";
import { backgroundsService } from "@/lib/services/backgrounds";
import type { PaginateBackgroundsParams } from "@/lib/services/backgrounds/service";

export const paginateMyBackgrounds = async (
  params: Omit<PaginateBackgroundsParams, "creatorId">
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return backgroundsService.paginatePublicBackgrounds({
    ...params,
    creatorId: session.user.id,
  });
};

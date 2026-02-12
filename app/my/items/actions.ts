"use server";

import { auth } from "@/lib/auth";
import { itemsService } from "@/lib/services/items/service";
import type { PaginateItemsParams } from "@/lib/services/items/types";

export const paginateMyItems = async (
  params: Omit<PaginateItemsParams, "creatorId">
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return itemsService.paginateMyItems(session.user.id, params);
};

"use server";

import { auth } from "@/lib/auth";
import {
  type PaginateHazardsParams,
  paginateMyHazards as paginateMyHazardsService,
} from "@/lib/services/hazards";

export async function paginateMyHazards(
  params: Omit<PaginateHazardsParams, "creatorId">
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return paginateMyHazardsService(session.user.id, params);
}

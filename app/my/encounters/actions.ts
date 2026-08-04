"use server";

import { parseEncounterSort } from "@/app/encounters/actions";
import { auth } from "@/lib/auth";
import { searchEncountersForCreator } from "@/lib/services/encounters/repository";
import type { EncounterOverview } from "@/lib/types";

export async function paginateMyEncounters(params: {
  sort: string;
  search: string | null;
  limit: number;
  pageParam: number;
}): Promise<{ data: EncounterOverview[] }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const data = await searchEncountersForCreator({
    ...parseEncounterSort(params.sort),
    searchTerm: params.search || undefined,
    limit: params.limit,
    offset: params.pageParam * params.limit,
    creatorId: session.user.id,
  });
  return { data };
}

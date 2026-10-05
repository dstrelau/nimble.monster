"use server";

import {
  type PaginatedEncounterResponse,
  parseEncounterSort,
} from "@/app/encounters/actions";
import { auth } from "@/lib/auth";
import { searchEncountersForCreator } from "@/lib/services/encounters/repository";

export async function paginateMyEncounters(params: {
  sort: string;
  search: string | null;
  limit: number;
  pageParam: number;
}): Promise<PaginatedEncounterResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const data = await searchEncountersForCreator({
    ...parseEncounterSort(params.sort),
    searchTerm: params.search || undefined,
    limit: params.limit + 1,
    offset: params.pageParam * params.limit,
    creatorId: session.user.id,
  });
  return {
    data: data.slice(0, params.limit),
    hasMore: data.length > params.limit,
  };
}

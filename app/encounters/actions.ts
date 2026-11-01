import { keepPreviousData } from "@tanstack/react-query";
import {
  type PaginatedEncounterResponse,
  parseEncounterSort,
} from "@/lib/services/encounters/pagination";
import * as encounters from "@/lib/services/encounters/repository";

export type { PaginatedEncounterResponse } from "@/lib/services/encounters/pagination";
export { parseEncounterSort } from "@/lib/services/encounters/pagination";

export type EncounterSortOption = "name" | "-name" | "createdAt" | "-createdAt";

export async function paginatePublicEncounters(params: {
  sort: string;
  search: string | null;
  limit: number;
  pageParam: number;
  creatorId?: string;
}): Promise<PaginatedEncounterResponse> {
  const data = await encounters.searchPublicEncounters({
    ...parseEncounterSort(params.sort),
    searchTerm: params.search || undefined,
    limit: params.limit + 1,
    offset: params.pageParam * params.limit,
    creatorId: params.creatorId,
  });
  return {
    data: data.slice(0, params.limit),
    hasMore: data.length > params.limit,
  };
}

export function publicEncountersInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  limit = 12,
  creatorId,
}: Partial<{
  search?: string | null;
  sort: string;
  limit?: number;
  creatorId?: string;
}> = {}) {
  const params = { search, sort, limit, creatorId };
  return {
    queryKey: ["encounters", params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      paginatePublicEncounters({ pageParam, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedEncounterResponse,
      _allPages: PaginatedEncounterResponse[],
      lastPageParam: number
    ) => {
      if (!lastPage.hasMore) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    getPreviousPageParam: (
      _firstPage: PaginatedEncounterResponse,
      _allPages: PaginatedEncounterResponse[],
      firstPageParam: number
    ) => {
      if (firstPageParam <= 1) {
        return undefined;
      }
      return firstPageParam - 1;
    },
  };
}

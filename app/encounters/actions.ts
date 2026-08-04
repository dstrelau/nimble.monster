import { keepPreviousData } from "@tanstack/react-query";
import type {
  EncounterSortBy,
  EncounterSortDirection,
} from "@/lib/services/encounters/repository";
import * as encounters from "@/lib/services/encounters/repository";
import type { EncounterOverview } from "@/lib/types";

export type EncounterSortOption = "name" | "-name" | "createdAt" | "-createdAt";

export type PaginatedEncounterResponse = {
  data: EncounterOverview[];
};

export function parseEncounterSort(sort: string): {
  sortBy: EncounterSortBy;
  sortDirection: EncounterSortDirection;
} {
  const desc = sort?.startsWith("-");
  const sortField = desc ? sort.slice(1) : sort;
  return {
    sortBy: sortField === "name" ? "name" : "createdAt",
    sortDirection: desc ? "desc" : "asc",
  };
}

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
    limit: params.limit,
    offset: params.pageParam * params.limit,
    creatorId: params.creatorId,
  });
  return { data };
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
      if (lastPage.data.length === 0) {
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

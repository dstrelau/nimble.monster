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

export async function paginatePublicEncounters(params: {
  sort: string;
  search: string | null;
  limit: number;
  pageParam: number;
}): Promise<PaginatedEncounterResponse> {
  const desc = params.sort?.startsWith("-");
  const sortDirection: EncounterSortDirection = desc ? "desc" : "asc";
  const sortField = desc ? params.sort.slice(1) : params.sort;
  const sortBy: EncounterSortBy = sortField === "name" ? "name" : "createdAt";
  const opts = {
    searchTerm: params.search || undefined,
    sortBy: sortBy,
    sortDirection,
    limit: params.limit,
    offset: params.pageParam * params.limit,
  };
  const data = await encounters.searchPublicEncounters(opts);
  return { data };
}

export function publicEncountersInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  limit = 12,
}: Partial<{
  search?: string | null;
  sort: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, limit };
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

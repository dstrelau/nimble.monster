import { keepPreviousData } from "@tanstack/react-query";
import { publicEncounters } from "@/app/%5Factions/publicEncounters/contract";
import { call } from "@/lib/contract";
import type { PaginatedEncounterResponse } from "@/lib/services/encounters/pagination";

export type { PaginatedEncounterResponse } from "@/lib/services/encounters/pagination";

export type EncounterSortOption = "name" | "-name" | "createdAt" | "-createdAt";

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
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal?: AbortSignal;
    }): Promise<PaginatedEncounterResponse> => {
      const page = await call(
        publicEncounters,
        { pageParam, ...params },
        { signal }
      );
      return {
        ...page,
        data: page.data.map((encounter) => ({
          ...encounter,
          createdAt: encounter.createdAt
            ? new Date(encounter.createdAt)
            : undefined,
          monsters: encounter.monsters.map((entry) => ({
            ...entry,
            monster: {
              ...entry.monster,
              createdAt: new Date(entry.monster.createdAt),
            },
          })),
        })),
      };
    },
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

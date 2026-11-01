import type { InfiniteData } from "@tanstack/react-query";
import { myEncounters } from "@/app/%5Factions/myEncounters/contract";
import { call } from "@/lib/contract";
import type { PaginatedEncounterResponse } from "@/lib/services/encounters/pagination";

export function myEncountersInfiniteQueryOptions(
  userId: string | undefined,
  {
    search = null,
    sort = "-createdAt",
    limit = 12,
  }: Partial<{
    search?: string | null;
    sort: string;
    limit?: number;
  }> = {}
) {
  const params = { search, sort, limit };
  return {
    queryKey: ["my-encounters", userId, params],
    enabled: Boolean(userId),
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal?: AbortSignal;
    }): Promise<PaginatedEncounterResponse> => {
      const page = await call(
        myEncounters,
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
    placeholderData: (
      previousData:
        | InfiniteData<PaginatedEncounterResponse, number>
        | undefined,
      previousQuery: { queryKey: readonly unknown[] } | undefined
    ) => (previousQuery?.queryKey[1] === userId ? previousData : undefined),
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
  };
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { listAllMonsterSources, paginatePublicMonsters } from "./actions";

export function monsterSourcesQueryOptions(props?: { enabled?: boolean }) {
  return {
    ...props,
    queryKey: ["monster-sources"],
    queryFn: async () => {
      return await listAllMonsterSources();
    },
    staleTime: 60000,
  };
}

export function useMonsterSourcesQuery(props?: { enabled?: boolean }) {
  return useQuery(monsterSourcesQueryOptions(props));
}

export function publicMonstersInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  type = "all",
  sourceId,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateMonstersSortOption;
  type: MonsterTypeOption;
  sourceId?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, type, sourceId, limit };
  return {
    queryKey: ["monsters", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginatePublicMonsters({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicMonstersResponse) => {
      return last.nextCursor;
    },
  };
}

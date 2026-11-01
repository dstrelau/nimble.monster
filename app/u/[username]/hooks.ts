import { keepPreviousData } from "@tanstack/react-query";
import { publicHazards } from "@/app/%5Factions/publicHazards/contract";
import { reviveHazard } from "@/app/%5Factions/statblockPickerSearch/queries";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import { call } from "@/lib/contract";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";

export function userProfileMonstersInfiniteQueryOptions(
  creatorId: string,
  {
    search,
    sort = "-createdAt",
    type = "all",
    source,
    role,
    level,
    limit = 12,
  }: Partial<{
    search?: string;
    sort: PaginateMonstersSortOption;
    type: MonsterTypeOption;
    source?: string;
    role?: MonsterRole;
    level?: number;
    limit?: number;
  }> = {}
) {
  return publicMonstersInfiniteQueryOptions({
    search,
    sort,
    type,
    source,
    role,
    level,
    limit,
    creatorId,
  });
}

export function userProfileHazardsInfiniteQueryOptions(
  creatorId: string,
  params: Omit<PaginateHazardsParams, "creatorId"> = {}
) {
  const request: PaginateHazardsParams = {
    limit: 12,
    sort: "-createdAt",
    ...params,
    creatorId,
  };
  return {
    queryKey: ["hazards", request],
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginateHazardsResponse> => {
      const result = await call(
        publicHazards,
        { ...request, cursor },
        { signal }
      );
      return { ...result, data: result.data.map(reviveHazard) };
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateHazardsResponse) => last.nextCursor,
  };
}

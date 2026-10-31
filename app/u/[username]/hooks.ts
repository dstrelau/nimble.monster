import { keepPreviousData } from "@tanstack/react-query";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { paginateUserProfileHazards } from "./actions";

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
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateUserProfileHazards({ ...request, cursor }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateHazardsResponse) => last.nextCursor,
  };
}

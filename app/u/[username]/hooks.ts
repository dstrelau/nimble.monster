import { keepPreviousData } from "@tanstack/react-query";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import {
  paginateUserProfileHazards,
  paginateUserProfileMonsters,
} from "./actions";

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
  const creatureType = type === "hazard" ? "all" : type;
  const params = {
    search,
    sort,
    type: creatureType,
    source,
    role,
    level,
    limit,
    creatorId,
  };
  return {
    queryKey: ["monsters", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateUserProfileMonsters({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicMonstersResponse) => {
      return last.nextCursor;
    },
  };
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

import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { paginateUserProfileMonsters } from "./actions";

export function userProfileMonstersInfiniteQueryOptions(
  creatorId: string,
  {
    search,
    sort = "-createdAt",
    type = "all",
    sourceId,
    role,
    limit = 12,
  }: Partial<{
    search?: string;
    sort: PaginateMonstersSortOption;
    type: MonsterTypeOption;
    sourceId?: string;
    role?: MonsterRole;
    limit?: number;
  }> = {}
) {
  const params = { search, sort, type, sourceId, role, limit, creatorId };
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

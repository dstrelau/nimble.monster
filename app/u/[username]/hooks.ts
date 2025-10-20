import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
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
    limit = 12,
  }: Partial<{
    search?: string;
    sort: PaginateMonstersSortOption;
    type: MonsterTypeOption;
    limit?: number;
  }> = {}
) {
  const params = { search, sort, type, limit, creatorId };
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

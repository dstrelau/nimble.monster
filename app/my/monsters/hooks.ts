import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { paginateMyMonsters } from "./actions";

export function myMonstersInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  type = "all",
  sourceId,
  role,
  level,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateMonstersSortOption;
  type: MonsterTypeOption;
  sourceId?: string;
  role?: MonsterRole;
  level?: number;
  limit?: number;
}> = {}) {
  const params = { search, sort, type, sourceId, role, level, limit };
  return {
    queryKey: ["my-monsters", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateMyMonsters({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicMonstersResponse) => {
      return last.nextCursor;
    },
  };
}

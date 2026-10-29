import { keepPreviousData } from "@tanstack/react-query";
import { publicMonsters } from "@/app/%5Factions/publicMonsters/contract";
import { reviveMonster } from "@/app/%5Factions/statblockPickerSearch/queries";
import { call } from "@/lib/contract";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";

export function publicMonstersInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  type = "all",
  source,
  role,
  level,
  creatorId,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateMonstersSortOption;
  type: MonsterTypeOption;
  source?: string;
  role?: MonsterRole;
  level?: number;
  creatorId?: string;
  limit?: number;
}> = {}) {
  const creatureType = type === "hazard" ? "all" : type;
  const params = {
    search,
    sort,
    type: creatureType,
    source,
    role,
    level,
    creatorId,
    limit,
  };
  return {
    queryKey: ["monsters", params],
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginatePublicMonstersResponse> => {
      const result = await call(
        publicMonsters,
        { cursor, ...params },
        { signal }
      );
      return { ...result, data: result.data.map(reviveMonster) };
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicMonstersResponse) => {
      return last.nextCursor;
    },
  };
}

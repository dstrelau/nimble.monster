import type { InfiniteData } from "@tanstack/react-query";
import { myMonsters } from "@/app/%5Factions/myMonsters/contract";
import { reviveMonster } from "@/app/%5Factions/statblockPickerSearch/queries";
import { call } from "@/lib/contract";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";

export function myMonstersInfiniteQueryOptions(
  userId: string | undefined,
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
  };
  return {
    queryKey: ["my-monsters", userId, params],
    enabled: Boolean(userId),
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginatePublicMonstersResponse> => {
      const result = await call(myMonsters, { cursor, ...params }, { signal });
      return { ...result, data: result.data.map(reviveMonster) };
    },
    placeholderData: (
      previousData:
        | InfiniteData<PaginatePublicMonstersResponse, string | undefined>
        | undefined,
      previousQuery: { queryKey: readonly unknown[] } | undefined
    ) => (previousQuery?.queryKey[1] === userId ? previousData : undefined),
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicMonstersResponse) => {
      return last.nextCursor;
    },
  };
}

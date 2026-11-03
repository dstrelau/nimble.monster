import type { InfiniteData } from "@tanstack/react-query";
import { myHazards } from "@/app/%5Factions/myHazards/contract";
import { reviveHazard } from "@/app/%5Factions/statblockPickerSearch/queries";
import { call } from "@/lib/contract";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";

export function myHazardsInfiniteQueryOptions(
  userId: string | undefined,
  params: Omit<PaginateHazardsParams, "creatorId"> = {}
) {
  const request = { limit: 12, sort: "-createdAt" as const, ...params };
  return {
    queryKey: ["my-hazards", userId, request],
    enabled: Boolean(userId),
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginateHazardsResponse> => {
      const result = await call(myHazards, { ...request, cursor }, { signal });
      return { ...result, data: result.data.map(reviveHazard) };
    },
    placeholderData: (
      previousData:
        | InfiniteData<PaginateHazardsResponse, string | undefined>
        | undefined,
      previousQuery: { queryKey: readonly unknown[] } | undefined
    ) => (previousQuery?.queryKey[1] === userId ? previousData : undefined),
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateHazardsResponse) => last.nextCursor,
  };
}

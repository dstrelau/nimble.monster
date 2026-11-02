import { keepPreviousData } from "@tanstack/react-query";
import { publicHazards } from "@/app/%5Factions/publicHazards/contract";
import { reviveHazard } from "@/app/%5Factions/statblockPickerSearch/queries";
import { call } from "@/lib/contract";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";

export function publicHazardsInfiniteQueryOptions(
  params: PaginateHazardsParams = {}
) {
  const request = { limit: 12, sort: "-createdAt" as const, ...params };
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

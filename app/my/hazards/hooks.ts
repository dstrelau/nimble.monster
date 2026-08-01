import { keepPreviousData } from "@tanstack/react-query";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";
import { paginateMyHazards } from "./actions";

export function myHazardsInfiniteQueryOptions(
  params: Omit<PaginateHazardsParams, "creatorId"> = {}
) {
  const request = { limit: 12, sort: "-createdAt" as const, ...params };
  return {
    queryKey: ["my-hazards", request],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateMyHazards({ ...request, cursor }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateHazardsResponse) => last.nextCursor,
  };
}

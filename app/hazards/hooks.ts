import { keepPreviousData } from "@tanstack/react-query";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";
import { paginatePublicHazards } from "./actions";

export function publicHazardsInfiniteQueryOptions(
  params: PaginateHazardsParams = {}
) {
  const request = { limit: 12, sort: "-createdAt" as const, ...params };
  return {
    queryKey: ["hazards", request],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginatePublicHazards({ ...request, cursor }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateHazardsResponse) => last.nextCursor,
  };
}

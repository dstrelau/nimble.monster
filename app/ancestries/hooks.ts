import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicAncestriesResponse } from "@/lib/services/ancestries/service";
import { paginatePublicAncestries } from "./actions";

export function publicAncestriesInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  sourceId,
  limit = 12,
}: Partial<{
  search?: string;
  sort: "-createdAt" | "createdAt" | "name" | "-name";
  sourceId?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, sourceId, limit };
  return {
    queryKey: ["ancestries", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginatePublicAncestries({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicAncestriesResponse) => {
      return last.nextCursor;
    },
  };
}

import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicAncestriesResponse } from "@/lib/services/ancestries/service";
import { paginateMyAncestries } from "./actions";

export function myAncestriesInfiniteQueryOptions({
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
    queryKey: ["my-ancestries", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateMyAncestries({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicAncestriesResponse) => {
      return last.nextCursor;
    },
  };
}

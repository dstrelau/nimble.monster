import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicBackgroundsResponse } from "@/lib/services/backgrounds/service";
import { paginatePublicBackgrounds } from "./actions";

export function publicBackgroundsInfiniteQueryOptions({
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
    queryKey: ["backgrounds", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginatePublicBackgrounds({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicBackgroundsResponse) => {
      return last.nextCursor;
    },
  };
}

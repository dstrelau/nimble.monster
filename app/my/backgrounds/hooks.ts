import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicBackgroundsResponse } from "@/lib/services/backgrounds/service";
import { paginateMyBackgrounds } from "./actions";

export function myBackgroundsInfiniteQueryOptions({
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
    queryKey: ["my-backgrounds", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateMyBackgrounds({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicBackgroundsResponse) => {
      return last.nextCursor;
    },
  };
}

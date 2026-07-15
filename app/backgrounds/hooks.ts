import { keepPreviousData } from "@tanstack/react-query";
import type {
  PaginateBackgroundsSortOption,
  PaginatePublicBackgroundsResponse,
} from "@/lib/services/backgrounds/service";
import { paginatePublicBackgrounds } from "./actions";

export function publicBackgroundsInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateBackgroundsSortOption;
  source?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, source, limit };
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

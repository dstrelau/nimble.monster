import { keepPreviousData } from "@tanstack/react-query";
import type {
  PaginateAncestriesSortOption,
  PaginatePublicAncestriesResponse,
} from "@/lib/services/ancestries/service";
import { paginateMyAncestries } from "./actions";

export function myAncestriesInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateAncestriesSortOption;
  source?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, source, limit };
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

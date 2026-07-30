import { keepPreviousData } from "@tanstack/react-query";
import type {
  PaginateAncestriesSortOption,
  PaginatePublicAncestriesResponse,
} from "@/lib/services/ancestries/service";
import { paginatePublicAncestries } from "./actions";

export function publicAncestriesInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  creatorId,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateAncestriesSortOption;
  source?: string;
  creatorId?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, source, creatorId, limit };
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

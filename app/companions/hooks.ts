import { keepPreviousData } from "@tanstack/react-query";
import type {
  CompanionClassOption,
  PaginateCompanionsSortOption,
  PaginatePublicCompanionsResponse,
} from "@/lib/services/companions/types";
import { paginatePublicCompanionsAction } from "./actions";

export function publicCompanionsInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  class: companionClass = "all",
  limit = 6,
}: Partial<{
  search?: string;
  sort: PaginateCompanionsSortOption;
  class: CompanionClassOption;
  limit?: number;
}> = {}) {
  const params = { search, sort, class: companionClass, limit };
  return {
    queryKey: ["companions", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginatePublicCompanionsAction({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicCompanionsResponse) => {
      return last.nextCursor;
    },
  };
}

import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatePublicItemsResponse } from "@/lib/services/items/service";
import type {
  ItemRarityFilter,
  PaginateItemsSortOption,
} from "@/lib/services/items/types";
import { paginateMyItems } from "./actions";

export function myItemsInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  rarity = "all",
  source,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateItemsSortOption;
  rarity: ItemRarityFilter;
  source?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, rarity, source, limit };
  return {
    queryKey: ["my-items", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateMyItems({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PaginatePublicItemsResponse) => {
      return last.nextCursor ?? undefined;
    },
  };
}

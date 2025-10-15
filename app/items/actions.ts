import { keepPreviousData } from "@tanstack/react-query";
import type { Item } from "@/lib/services/items";
import * as items from "@/lib/services/items/repository";
import type {
  ItemMini,
  ItemRarityFilter,
  ItemSortBy,
  ItemSortDirection,
} from "@/lib/services/items/types";

export type ItemSortOption = "name" | "-name" | "createdAt" | "-createdAt";

export type PaginatedItemResponse = {
  data: Item[];
  nextPage: string;
};

export async function paginatePublicItems(params: {
  sort: string;
  rarity: string;
  search: string | null;
  limit: number;
  pageParam: number;
}): Promise<PaginatedItemResponse> {
  const desc = params.sort?.startsWith("-");
  const sortDirection: ItemSortDirection = desc ? "desc" : "asc";
  const sortField = desc ? params.sort.slice(1) : params.sort;
  const sortBy: ItemSortBy = sortField === "name" ? "name" : "createdAt";
  const opts = {
    searchTerm: params.search || undefined,
    sortBy: sortBy,
    sortDirection,
    rarity: params.rarity as ItemRarityFilter,
    limit: params.limit,
    offset: params.pageParam * params.limit,
  };
  const data = await items.searchPublicItems(opts);
  return { data, nextPage: "next" };
}

export function publicItemsInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  rarity = "all",
  limit = 12,
}: Partial<{
  search?: string | null;
  sort: string;
  rarity: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, rarity, limit };
  return {
    queryKey: ["items", params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      paginatePublicItems({ pageParam, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedItemResponse,
      _allPages: PaginatedItemResponse[],
      lastPageParam: number
    ) => {
      if (lastPage.data.length === 0) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    getPreviousPageParam: (
      _firstPage: PaginatedItemResponse,
      _allPages: PaginatedItemResponse[],
      firstPageParam: number
    ) => {
      if (firstPageParam <= 1) {
        return undefined;
      }
      return firstPageParam - 1;
    },
  };
}

export async function listPublicItems(): Promise<ItemMini[]> {
  return items.listPublicItems();
}

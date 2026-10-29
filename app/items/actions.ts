import { keepPreviousData } from "@tanstack/react-query";
import { publicItems } from "@/app/%5Factions/publicItems/contract";
import { reviveItem } from "@/app/%5Factions/statblockPickerSearch/queries";
import { call } from "@/lib/contract";
import type { PublicItemPageResponse } from "@/lib/services/items/service";
import type { PaginateItemsSortOption } from "@/lib/services/items/types";

export type ItemSortOption = PaginateItemsSortOption;

export type PaginatedItemResponse = PublicItemPageResponse;

export function publicItemsInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  rarity = "all",
  source,
  creatorId,
  limit = 12,
}: Partial<{
  search?: string | null;
  sort: string;
  rarity: string;
  source?: string;
  creatorId?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, rarity, source, creatorId, limit };
  return {
    queryKey: ["items", params],
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal?: AbortSignal;
    }): Promise<PaginatedItemResponse> => {
      const result = await call(
        publicItems,
        { pageParam, ...params },
        { signal }
      );
      return { ...result, data: result.data.map(reviveItem) };
    },
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedItemResponse,
      _allPages: PaginatedItemResponse[],
      lastPageParam: number
    ) => {
      if (!lastPage.hasMore) {
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

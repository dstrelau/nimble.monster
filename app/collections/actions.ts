import { keepPreviousData } from "@tanstack/react-query";
import { publicCollections } from "@/app/%5Factions/publicCollections/contract";
import { call } from "@/lib/contract";
import type { PublicCollectionPageResponse } from "@/lib/services/collections/service";
import { reviveCollectionOverview } from "./serialization";

export type CollectionSortOption =
  | "name"
  | "-name"
  | "createdAt"
  | "-createdAt";

export type PaginatedCollectionResponse = PublicCollectionPageResponse;

export function publicCollectionsInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  limit = 12,
}: Partial<{
  search?: string | null;
  sort: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, limit };
  return {
    queryKey: ["collections", params],
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal?: AbortSignal;
    }): Promise<PaginatedCollectionResponse> => {
      const result = await call(
        publicCollections,
        { pageParam, ...params },
        { signal }
      );
      return { ...result, data: result.data.map(reviveCollectionOverview) };
    },
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedCollectionResponse,
      _allPages: PaginatedCollectionResponse[],
      lastPageParam: number
    ) => {
      if (!lastPage.hasMore) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    getPreviousPageParam: (
      _firstPage: PaginatedCollectionResponse,
      _allPages: PaginatedCollectionResponse[],
      firstPageParam: number
    ) => {
      if (firstPageParam <= 1) {
        return undefined;
      }
      return firstPageParam - 1;
    },
  };
}

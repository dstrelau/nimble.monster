import { keepPreviousData } from "@tanstack/react-query";
import type {
  CollectionSortBy,
  CollectionSortDirection,
} from "@/lib/services/collections/repository";
import * as collections from "@/lib/services/collections/repository";
import type { CollectionOverview } from "@/lib/types";

export type CollectionSortOption =
  | "name"
  | "-name"
  | "createdAt"
  | "-createdAt";

export type PaginatedCollectionResponse = {
  data: CollectionOverview[];
};

export async function paginatePublicCollections(params: {
  sort: string;
  search: string | null;
  limit: number;
  pageParam: number;
}): Promise<PaginatedCollectionResponse> {
  const desc = params.sort?.startsWith("-");
  const sortDirection: CollectionSortDirection = desc ? "desc" : "asc";
  const sortField = desc ? params.sort.slice(1) : params.sort;
  const sortBy: CollectionSortBy = sortField === "name" ? "name" : "createdAt";
  const opts = {
    searchTerm: params.search || undefined,
    sortBy: sortBy,
    sortDirection,
    limit: params.limit,
    offset: params.pageParam * params.limit,
  };
  const data = await collections.searchPublicCollections(opts);
  return { data };
}

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
    queryFn: ({ pageParam }: { pageParam: number }) =>
      paginatePublicCollections({ pageParam, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedCollectionResponse,
      _allPages: PaginatedCollectionResponse[],
      lastPageParam: number
    ) => {
      if (lastPage.data.length === 0) {
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

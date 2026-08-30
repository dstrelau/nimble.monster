import { keepPreviousData } from "@tanstack/react-query";
import type {
  RandomTableSortOption,
  SearchRandomTablesResult,
} from "@/app/%5Factions/_random-tables/contract";
import { searchRandomTables } from "@/app/%5Factions/_random-tables/contract";
import { call } from "@/lib/contract";
import type { RandomTable } from "@/lib/types";

export type { RandomTableSortOption };

export function isRandomTableSortOption(
  value: string
): value is RandomTableSortOption {
  return ["name", "-name", "createdAt", "-createdAt"].some(
    (option) => option === value
  );
}

export type PaginatedRandomTableResponse = {
  data: RandomTable[];
};

export async function paginatePublicRandomTables(params: {
  sort: RandomTableSortOption;
  search: string | null;
  limit: number;
  pageParam: number;
}): Promise<PaginatedRandomTableResponse> {
  const result: SearchRandomTablesResult = await call(searchRandomTables, {
    sort: params.sort,
    search: params.search,
    limit: params.limit,
    page: params.pageParam,
  });
  return {
    data: result.data.map((randomTable) => ({
      ...randomTable,
      createdAt: randomTable.createdAt
        ? new Date(randomTable.createdAt)
        : undefined,
    })),
  };
}

export function publicRandomTablesInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  limit = 12,
}: Partial<{
  search?: string | null;
  sort: RandomTableSortOption;
  limit?: number;
}> = {}) {
  const params: {
    search: string | null;
    sort: RandomTableSortOption;
    limit: number;
  } = { search, sort, limit };
  return {
    queryKey: ["random-tables", params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      paginatePublicRandomTables({ pageParam, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedRandomTableResponse,
      _allPages: PaginatedRandomTableResponse[],
      lastPageParam: number
    ) => {
      if (lastPage.data.length === 0) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    getPreviousPageParam: (
      _firstPage: PaginatedRandomTableResponse,
      _allPages: PaginatedRandomTableResponse[],
      firstPageParam: number
    ) => {
      if (firstPageParam <= 1) {
        return undefined;
      }
      return firstPageParam - 1;
    },
  };
}

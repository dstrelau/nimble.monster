import { keepPreviousData } from "@tanstack/react-query";
import type { PaginatedEncounterResponse } from "@/app/encounters/actions";
import { paginateMyEncounters } from "./actions";

export function myEncountersInfiniteQueryOptions({
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
    queryKey: ["my-encounters", params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      paginateMyEncounters({ pageParam, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedEncounterResponse,
      _allPages: PaginatedEncounterResponse[],
      lastPageParam: number
    ) => {
      if (lastPage.data.length === 0) {
        return undefined;
      }
      return lastPageParam + 1;
    },
  };
}

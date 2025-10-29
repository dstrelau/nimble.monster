import { keepPreviousData } from "@tanstack/react-query";
import type { PaginateClassAbilityListsResponse } from "@/lib/services/classAbilityLists/service";
import { paginateMyClassAbilityLists } from "./actions";

export function myClassAbilityListsInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  characterClass,
  limit = 12,
}: Partial<{
  search?: string;
  sort: "-createdAt" | "createdAt" | "name" | "-name";
  characterClass?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, characterClass, limit };
  return {
    queryKey: ["my-class-ability-lists", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginateMyClassAbilityLists({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateClassAbilityListsResponse) => {
      return last.nextCursor;
    },
  };
}

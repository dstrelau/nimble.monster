import { keepPreviousData } from "@tanstack/react-query";
import type { PaginateClassAbilityListsResponse } from "@/lib/services/classAbilityLists/service";
import { paginatePublicClassAbilityLists } from "./actions";

export function publicClassAbilityListsInfiniteQueryOptions({
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
    queryKey: ["class-ability-lists", params],
    queryFn: ({ pageParam: cursor }: { pageParam?: string }) =>
      paginatePublicClassAbilityLists({ cursor, ...params }),
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginateClassAbilityListsResponse) => {
      return last.nextCursor;
    },
  };
}

import { keepPreviousData } from "@tanstack/react-query";
import { publicCompanions } from "@/app/%5Factions/publicCompanions/contract";
import { call } from "@/lib/contract";
import type {
  CompanionClassOption,
  PaginateCompanionsSortOption,
  PaginatePublicCompanionsResponse,
} from "@/lib/services/companions/types";

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
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginatePublicCompanionsResponse> => {
      const result = await call(
        publicCompanions,
        { cursor, ...params },
        { signal }
      );
      return {
        ...result,
        data: result.data.map((companion) => ({
          ...companion,
          updatedAt: new Date(companion.updatedAt),
          source: companion.source
            ? {
                ...companion.source,
                createdAt: new Date(companion.source.createdAt),
                updatedAt: new Date(companion.source.updatedAt),
              }
            : undefined,
          awards: companion.awards?.map((award) => ({
            ...award,
            createdAt: new Date(award.createdAt),
            updatedAt: new Date(award.updatedAt),
          })),
        })),
      };
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicCompanionsResponse) => {
      return last.nextCursor;
    },
  };
}

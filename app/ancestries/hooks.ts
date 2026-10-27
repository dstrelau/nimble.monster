import { keepPreviousData } from "@tanstack/react-query";
import { publicAncestries } from "@/app/%5Factions/publicAncestries/contract";
import { call } from "@/lib/contract";
import type {
  PaginateAncestriesSortOption,
  PaginatePublicAncestriesResponse,
} from "@/lib/services/ancestries/service";

export function publicAncestriesInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  creatorId,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateAncestriesSortOption;
  source?: string;
  creatorId?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, source, creatorId, limit };
  return {
    queryKey: ["ancestries", params],
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginatePublicAncestriesResponse> => {
      const result = await call(
        publicAncestries,
        { cursor, ...params },
        { signal }
      );
      return {
        ...result,
        data: result.data.map((ancestry) => ({
          ...ancestry,
          createdAt: new Date(ancestry.createdAt),
          updatedAt: new Date(ancestry.updatedAt),
          source: ancestry.source
            ? {
                ...ancestry.source,
                createdAt: new Date(ancestry.source.createdAt),
                updatedAt: new Date(ancestry.source.updatedAt),
              }
            : undefined,
          awards: ancestry.awards?.map((award) => ({
            ...award,
            createdAt: new Date(award.createdAt),
            updatedAt: new Date(award.updatedAt),
          })),
        })),
      };
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicAncestriesResponse) => {
      return last.nextCursor;
    },
  };
}

import { myAncestries } from "@/app/%5Factions/myAncestries/contract";
import { call } from "@/lib/contract";
import type {
  PaginateAncestriesSortOption,
  PaginatePublicAncestriesResponse,
} from "@/lib/services/ancestries/service";

export function myAncestriesInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  limit = 12,
  ownerId,
}: Partial<{
  search?: string;
  sort: PaginateAncestriesSortOption;
  source?: string;
  limit?: number;
  ownerId: string;
}> = {}) {
  const params = { search, sort, source, limit };
  return {
    queryKey: ["my-ancestries", ownerId, params],
    enabled: !!ownerId,
    queryFn: async ({
      pageParam: cursor,
    }: {
      pageParam?: string;
    }): Promise<PaginatePublicAncestriesResponse> => {
      const result = await call(myAncestries, { cursor, ...params });
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
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicAncestriesResponse) => {
      return last.nextCursor;
    },
  };
}

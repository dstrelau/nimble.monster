import { keepPreviousData } from "@tanstack/react-query";
import { publicBackgrounds } from "@/app/%5Factions/publicBackgrounds/contract";
import { call } from "@/lib/contract";
import type {
  PaginateBackgroundsSortOption,
  PaginatePublicBackgroundsResponse,
} from "@/lib/services/backgrounds/service";

export function publicBackgroundsInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  creatorId,
  limit = 12,
}: Partial<{
  search?: string;
  sort: PaginateBackgroundsSortOption;
  source?: string;
  creatorId?: string;
  limit?: number;
}> = {}) {
  const params = { search, sort, source, creatorId, limit };
  return {
    queryKey: ["backgrounds", params],
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginatePublicBackgroundsResponse> => {
      const result = await call(
        publicBackgrounds,
        { cursor, ...params },
        { signal }
      );
      return {
        ...result,
        data: result.data.map((background) => ({
          ...background,
          createdAt: new Date(background.createdAt),
          updatedAt: new Date(background.updatedAt),
          source: background.source
            ? {
                ...background.source,
                createdAt: new Date(background.source.createdAt),
                updatedAt: new Date(background.source.updatedAt),
              }
            : undefined,
          awards: background.awards?.map((award) => ({
            ...award,
            createdAt: new Date(award.createdAt),
            updatedAt: new Date(award.updatedAt),
          })),
        })),
      };
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicBackgroundsResponse) => {
      return last.nextCursor;
    },
  };
}

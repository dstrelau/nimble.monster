import type { InfiniteData } from "@tanstack/react-query";
import { myBackgrounds } from "@/app/%5Factions/myBackgrounds/contract";
import { call } from "@/lib/contract";
import type {
  PaginateBackgroundsSortOption,
  PaginatePublicBackgroundsResponse,
} from "@/lib/services/backgrounds/service";

export function myBackgroundsInfiniteQueryOptions(
  userId: string | undefined,
  {
    search,
    sort = "-createdAt",
    source,
    limit = 12,
  }: Partial<{
    search?: string;
    sort: PaginateBackgroundsSortOption;
    source?: string;
    limit?: number;
  }> = {}
) {
  const params = { search, sort, source, limit };
  return {
    queryKey: ["my-backgrounds", userId, params],
    enabled: Boolean(userId),
    queryFn: async ({
      pageParam: cursor,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }): Promise<PaginatePublicBackgroundsResponse> => {
      const result = await call(
        myBackgrounds,
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
    placeholderData: (
      previousData:
        | InfiniteData<PaginatePublicBackgroundsResponse, string | undefined>
        | undefined,
      previousQuery: { queryKey: readonly unknown[] } | undefined
    ) => (previousQuery?.queryKey[1] === userId ? previousData : undefined),
    initialPageParam: undefined,
    getNextPageParam: (last: PaginatePublicBackgroundsResponse) => {
      return last.nextCursor;
    },
  };
}

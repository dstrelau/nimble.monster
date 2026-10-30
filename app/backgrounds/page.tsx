import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedBackgroundGrid } from "@/components/background/PaginatedBackgroundGrid";
import { getQueryClient } from "@/lib/queryClient";
import { backgroundsService } from "@/lib/services/backgrounds/service";
import {
  listSourcesForEntityType,
  sourcesForEntityTypeQueryOptions,
} from "@/lib/services/sources";
import { publicBackgroundsInfiniteQueryOptions } from "./hooks";

export default async function BackgroundsPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      ...publicBackgroundsInfiniteQueryOptions(),
      queryFn: () =>
        backgroundsService.paginatePublicBackgrounds({
          sort: "-createdAt",
          limit: 12,
        }),
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("backgrounds"),
      queryFn: () => listSourcesForEntityType("backgrounds"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedBackgroundGrid kind="backgrounds" />
    </HydrationBoundary>
  );
}

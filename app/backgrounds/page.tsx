import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedBackgroundGrid } from "@/app/ui/background/PaginatedBackgroundGrid";
import { getQueryClient } from "@/lib/queryClient";
import { sourcesForEntityTypeQueryOptions } from "@/lib/services/sources";
import { publicBackgroundsInfiniteQueryOptions } from "./hooks";

export default async function BackgroundsPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery(publicBackgroundsInfiniteQueryOptions()),
    queryClient.prefetchQuery(sourcesForEntityTypeQueryOptions("backgrounds")),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedBackgroundGrid kind="backgrounds" />
    </HydrationBoundary>
  );
}

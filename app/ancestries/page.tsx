import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedAncestryGrid } from "@/app/ui/ancestry/PaginatedAncestryGrid";
import { getQueryClient } from "@/lib/queryClient";
import { sourcesForEntityTypeQueryOptions } from "@/lib/services/sources";
import { publicAncestriesInfiniteQueryOptions } from "./hooks";

export default async function AncestriesPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery(publicAncestriesInfiniteQueryOptions()),
    queryClient.prefetchQuery(sourcesForEntityTypeQueryOptions("ancestries")),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedAncestryGrid kind="ancestries" />
    </HydrationBoundary>
  );
}

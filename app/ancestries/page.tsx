import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedAncestryGrid } from "@/components/ancestry/PaginatedAncestryGrid";
import { getQueryClient } from "@/lib/queryClient";
import { ancestriesService } from "@/lib/services/ancestries/service";
import {
  listSourcesForEntityType,
  sourcesForEntityTypeQueryOptions,
} from "@/lib/services/sources";
import { publicAncestriesInfiniteQueryOptions } from "./hooks";

export default async function AncestriesPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      ...publicAncestriesInfiniteQueryOptions(),
      queryFn: () =>
        ancestriesService.paginatePublicAncestries({
          sort: "-createdAt",
          limit: 12,
        }),
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("ancestries"),
      queryFn: () => listSourcesForEntityType("ancestries"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedAncestryGrid kind="ancestries" />
    </HydrationBoundary>
  );
}

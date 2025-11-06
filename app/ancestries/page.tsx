import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedAncestryGrid } from "@/app/ui/ancestry/PaginatedAncestryGrid";
import { getQueryClient } from "@/lib/queryClient";
import { publicAncestriesInfiniteQueryOptions } from "./hooks";

export default async function AncestriesPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    publicAncestriesInfiniteQueryOptions()
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedAncestryGrid kind="ancestries" />
    </HydrationBoundary>
  );
}

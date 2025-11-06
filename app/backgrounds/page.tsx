import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedBackgroundGrid } from "@/app/ui/background/PaginatedBackgroundGrid";
import { getQueryClient } from "@/lib/queryClient";
import { publicBackgroundsInfiniteQueryOptions } from "./hooks";

export default async function BackgroundsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    publicBackgroundsInfiniteQueryOptions()
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedBackgroundGrid kind="backgrounds" />
    </HydrationBoundary>
  );
}

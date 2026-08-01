import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { myHazardsInfiniteQueryOptions } from "@/app/my/hazards/hooks";
import { PaginatedMonsterGrid } from "@/components/monster/PaginatedMonsterGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { sourcesQueryOptions } from "@/lib/services/sources";

export default async function MyHazardsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(sourcesQueryOptions()),
    queryClient.prefetchInfiniteQuery(
      myHazardsInfiniteQueryOptions({ sort: "-createdAt" })
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedMonsterGrid kind="my-monsters" entityType="hazards" />
    </HydrationBoundary>
  );
}

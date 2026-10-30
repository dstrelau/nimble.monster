import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { myHazardsInfiniteQueryOptions } from "@/app/my/hazards/hooks";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { PaginatedMonsterGrid } from "@/components/monster/PaginatedMonsterGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { listAllSources, sourcesQueryOptions } from "@/lib/services/sources";

export default async function MyHazardsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...sourcesQueryOptions(),
      queryFn: listAllSources,
    }),
    queryClient.prefetchInfiniteQuery(
      myHazardsInfiniteQueryOptions({ sort: "-createdAt" })
    ),
  ]);

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={TriangleAlert}
        title="My Hazards"
        newHref="/hazards/new"
        newLabel="New Hazard"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedMonsterGrid kind="my-monsters" entityType="hazards" />
      </HydrationBoundary>
    </div>
  );
}

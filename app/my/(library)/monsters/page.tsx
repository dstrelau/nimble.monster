import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { PaginatedMonsterGrid } from "@/components/monster/PaginatedMonsterGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { monstersService } from "@/lib/services/monsters";
import { listAllSources, sourcesQueryOptions } from "@/lib/services/sources";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";
import { myMonstersInfiniteQueryOptions } from "./hooks";

export default async function MyMonstersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...sourcesQueryOptions(),
      queryFn: listAllSources,
    }),
    queryClient.prefetchInfiniteQuery({
      ...myMonstersInfiniteQueryOptions(session.user.id, {
        sort: "-createdAt",
        type: "all",
      }),
      queryFn: () =>
        monstersService.paginateMyMonsters(session.user.id, {
          sort: "-createdAt",
          type: "all",
          limit: 12,
        }),
    }),
  ]);

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.monster}
        title="My Monsters"
        newHref="/monsters/new"
        newLabel="New Monster"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedMonsterGrid kind="my-monsters" />
      </HydrationBoundary>
    </div>
  );
}

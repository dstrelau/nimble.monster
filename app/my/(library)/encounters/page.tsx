import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { myEncountersInfiniteQueryOptions } from "@/app/my/(library)/encounters/hooks";
import { EncountersListView } from "@/components/encounter/EncountersListView";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { paginateMyEncounters } from "@/lib/services/encounters/pagination";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyEncountersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    ...myEncountersInfiniteQueryOptions(session.user.id),
    queryFn: ({ pageParam }) =>
      paginateMyEncounters(session.user.id, { pageParam }),
  });

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.encounter}
        title="My Encounters"
        newHref="/encounters/new"
        newLabel="New Encounter"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EncountersListView kind="my-encounters" />
      </HydrationBoundary>
    </div>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PaginatedBackgroundGrid } from "@/components/background/PaginatedBackgroundGrid";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { backgroundsService } from "@/lib/services/backgrounds/service";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";
import { myBackgroundsInfiniteQueryOptions } from "./hooks";

export default async function MyBackgroundsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    ...myBackgroundsInfiniteQueryOptions(session.user.id),
    queryFn: ({ pageParam: cursor }) =>
      backgroundsService.paginatePublicBackgrounds({
        creatorId: session.user.id,
        sort: "-createdAt",
        limit: 12,
        cursor,
      }),
  });

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.background}
        title="My Backgrounds"
        newHref="/backgrounds/new"
        newLabel="New Background"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedBackgroundGrid kind="my-backgrounds" />
      </HydrationBoundary>
    </div>
  );
}

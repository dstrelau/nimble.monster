import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PaginatedAncestryGrid } from "@/components/ancestry/PaginatedAncestryGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { paginatePublicAncestries } from "@/lib/services/ancestries/repository";
import { myAncestriesInfiniteQueryOptions } from "./hooks";

export default async function MyAncestriesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    ...myAncestriesInfiniteQueryOptions({ ownerId: session.user.id }),
    queryFn: ({ pageParam: cursor }) =>
      paginatePublicAncestries(
        { cursor, sort: "-createdAt", limit: 12, creatorId: session.user.id },
        true
      ),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedAncestryGrid kind="my-ancestries" />
    </HydrationBoundary>
  );
}

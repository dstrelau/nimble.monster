import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PaginatedAncestryGrid } from "@/app/ui/ancestry/PaginatedAncestryGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { myAncestriesInfiniteQueryOptions } from "./hooks";

export default async function MyAncestriesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(myAncestriesInfiniteQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedAncestryGrid kind="my-ancestries" />
    </HydrationBoundary>
  );
}

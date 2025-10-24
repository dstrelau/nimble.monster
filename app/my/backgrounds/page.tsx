import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PaginatedBackgroundGrid } from "@/app/ui/background/PaginatedBackgroundGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { myBackgroundsInfiniteQueryOptions } from "./hooks";

export default async function MyBackgroundsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    myBackgroundsInfiniteQueryOptions()
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedBackgroundGrid kind="my-backgrounds" />
    </HydrationBoundary>
  );
}

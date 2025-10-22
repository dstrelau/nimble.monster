import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PaginatedMonsterGrid } from "@/app/ui/monster/PaginatedMonsterGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { sourcesQueryOptions } from "@/lib/services/sources";
import { myMonstersInfiniteQueryOptions } from "./hooks";

export default async function MyMonstersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(sourcesQueryOptions()),
    queryClient.prefetchInfiniteQuery(
      myMonstersInfiniteQueryOptions({ sort: "-createdAt", type: "all" })
    ),
  ]);

  return (
    <div className="container mx-auto">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedMonsterGrid kind="my-monsters" />
      </HydrationBoundary>
    </div>
  );
}

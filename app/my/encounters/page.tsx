import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { myEncountersInfiniteQueryOptions } from "@/app/my/encounters/hooks";
import { EncountersListView } from "@/components/encounter/EncountersListView";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";

export default async function MyEncountersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(myEncountersInfiniteQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EncountersListView kind="my-encounters" />
    </HydrationBoundary>
  );
}

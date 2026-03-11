import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import BuildSubclassView from "@/app/subclasses/BuildSubclassView";
import { subclassClassOptionsQueryOptions } from "@/app/subclasses/hooks";
import { getQueryClient } from "@/lib/queryClient";

export default async function NewSubclassPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(subclassClassOptionsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildSubclassView />
    </HydrationBoundary>
  );
}

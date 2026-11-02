import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import BuildSubclassView from "@/app/subclasses/BuildSubclassView";
import { subclassClassOptionsQueryOptions } from "@/app/subclasses/hooks";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import { auth } from "@/lib/auth";
import { searchClassesForSubclass } from "@/lib/db/class";
import { getQueryClient } from "@/lib/queryClient";

export default async function NewSubclassPage() {
  const session = await auth();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...subclassClassOptionsQueryOptions(undefined, session?.user?.id),
    queryFn: () => searchClassesForSubclass({ userId: session?.user?.id }),
  });

  return (
    <HydratedBuilderData>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BuildSubclassView />
      </HydrationBoundary>
    </HydratedBuilderData>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PaginatedAbilityListGrid } from "@/app/ui/class-options/PaginatedAbilityListGrid";
import { getQueryClient } from "@/lib/queryClient";
import { publicClassAbilityListsInfiniteQueryOptions } from "./hooks";

export default async function ClassOptionsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    publicClassAbilityListsInfiniteQueryOptions()
  );

  return (
    <div className="container mx-auto">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedAbilityListGrid kind="class-ability-lists" />
      </HydrationBoundary>
    </div>
  );
}

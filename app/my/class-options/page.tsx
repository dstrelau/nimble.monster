import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PaginatedAbilityListGrid } from "@/app/ui/class-options/PaginatedAbilityListGrid";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { myClassAbilityListsInfiniteQueryOptions } from "./hooks";

export default async function MyClassAbilityListsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    myClassAbilityListsInfiniteQueryOptions()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedAbilityListGrid kind="my-class-ability-lists" />
      </HydrationBoundary>
    </div>
  );
}

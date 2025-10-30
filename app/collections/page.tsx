import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CollectionsListView } from "@/app/ui/collection/CollectionsListView";
import { getQueryClient } from "@/lib/queryClient";
import { publicCollectionsInfiniteQueryOptions } from "./actions";

const searchParamsSchema = z.object({
  sort: z
    .enum(["createdAt", "-createdAt", "name", "-name"])
    .default("-createdAt"),
  search: z.string().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/collections");
  }
  const params = parseResult.data;

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    publicCollectionsInfiniteQueryOptions(params)
  );

  return (
    <div className="container mx-auto py-3">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CollectionsListView />
      </HydrationBoundary>
    </div>
  );
}

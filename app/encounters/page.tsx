import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EncountersListView } from "@/components/encounter/EncountersListView";
import { getQueryClient } from "@/lib/queryClient";
import { publicEncountersInfiniteQueryOptions } from "./actions";

const searchParamsSchema = z.object({
  sort: z
    .enum(["createdAt", "-createdAt", "name", "-name"])
    .default("-createdAt"),
  search: z.string().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function EncountersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/encounters");
  }
  const params = parseResult.data;

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    publicEncountersInfiniteQueryOptions(params)
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EncountersListView />
    </HydrationBoundary>
  );
}

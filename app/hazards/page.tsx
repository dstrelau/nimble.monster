import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { z } from "zod";
import { publicHazardsInfiniteQueryOptions } from "@/app/hazards/hooks";
import { PaginatedMonsterGrid } from "@/components/monster/PaginatedMonsterGrid";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { PaginateMonstersSortOptions } from "@/lib/services/monsters/types";
import { sourcesForEntityTypeQueryOptions } from "@/lib/services/sources";

const searchParamsSchema = z.object({
  sort: z.enum(PaginateMonstersSortOptions).default("-createdAt"),
  search: z.string().optional(),
  source: z.string().optional(),
  level: z.coerce.number().optional(),
});

export default async function HazardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParamsSchema.parse(await searchParams);
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(sourcesForEntityTypeQueryOptions("monsters")),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
    queryClient.prefetchInfiniteQuery(
      publicHazardsInfiniteQueryOptions(params)
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedMonsterGrid kind="monsters" entityType="hazards" />
    </HydrationBoundary>
  );
}

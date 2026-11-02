import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { z } from "zod";
import { publicHazardsInfiniteQueryOptions } from "@/app/hazards/hooks";
import { PaginatedMonsterGrid } from "@/components/monster/PaginatedMonsterGrid";
import { listOfficialConditions } from "@/lib/db/condition";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { paginatePublicHazards } from "@/lib/services/hazards";
import { PaginateMonstersSortOptions } from "@/lib/services/monsters/types";
import {
  listSourcesForEntityType,
  sourcesForEntityTypeQueryOptions,
} from "@/lib/services/sources";

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
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("monsters"),
      queryFn: () => listSourcesForEntityType("monsters"),
    }),
    queryClient.prefetchQuery({
      ...officialConditionsQueryOptions(),
      queryFn: listOfficialConditions,
    }),
    queryClient.prefetchInfiniteQuery({
      ...publicHazardsInfiniteQueryOptions(params),
      queryFn: ({ pageParam: cursor }) =>
        paginatePublicHazards({ limit: 12, ...params, cursor }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaginatedMonsterGrid kind="monsters" entityType="hazards" />
    </HydrationBoundary>
  );
}

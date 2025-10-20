import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PaginatedMonsterGrid } from "@/app/ui/monster/PaginatedMonsterGrid";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { monstersService } from "@/lib/services/monsters";
import { getMonsterUrl } from "@/lib/utils/url";
import { publicMonstersInfiniteQueryOptions } from "./hooks";

const searchParamsSchema = z.object({
  id: z.string().optional(),
  sort: z
    .enum(["createdAt", "-createdAt", "level", "-level", "name", "-name"])
    .default("-createdAt"),
  type: z.enum(["all", "standard", "legendary", "minion"]).default("all"),
  search: z.string().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/monsters");
  }
  const params = parseResult.data;

  if (params.id) {
    const m = await monstersService.getPublicMonster(params.id);
    if (!m) redirect("/monsters");
    if (m) redirect(getMonsterUrl(m));
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(officialConditionsQueryOptions());
  void queryClient.prefetchInfiniteQuery(
    publicMonstersInfiniteQueryOptions(params)
  );

  return (
    <div className="container mx-auto">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedMonsterGrid kind="monsters" />
      </HydrationBoundary>
    </div>
  );
}

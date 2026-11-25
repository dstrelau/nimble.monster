import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CollectionsListView } from "@/components/collection/CollectionsListView";
import {
  MONSTERY_MONDAY_BANNER_WEEK,
  MonsteryMondayBanner,
} from "@/components/home/MonsteryMondayBanner";
import { getQueryClient } from "@/lib/queryClient";
import {
  findMonsteryMondayWeek,
  getMonsteryMondayOverview,
} from "@/lib/services/collections/queries";
import { publicCollectionPage } from "@/lib/services/collections/service";
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
  const [monsteryMondayWeek, monsteryMonday] = await Promise.all([
    findMonsteryMondayWeek(MONSTERY_MONDAY_BANNER_WEEK),
    getMonsteryMondayOverview(),
    queryClient.prefetchInfiniteQuery({
      ...publicCollectionsInfiniteQueryOptions(params),
      queryFn: ({ pageParam }) =>
        publicCollectionPage({ pageParam, ...params }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mb-6">
        <MonsteryMondayBanner
          week={monsteryMondayWeek}
          monsters={monsteryMonday.counts.monsters}
          items={monsteryMonday.counts.items}
          creators={monsteryMonday.creators.length}
        />
      </div>
      <CollectionsListView />
    </HydrationBoundary>
  );
}

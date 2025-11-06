import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ItemsListView } from "@/app/items/ItemsListView";
import { getQueryClient } from "@/lib/queryClient";
import * as items from "@/lib/services/items/repository";
import { sourcesQueryOptions } from "@/lib/services/sources";
import { getItemUrl } from "@/lib/utils/url";
import { publicItemsInfiniteQueryOptions } from "./actions";

const searchParamsSchema = z.object({
  id: z.string().optional(),
  sort: z
    .enum(["createdAt", "-createdAt", "name", "-name"])
    .default("-createdAt"),
  rarity: z
    .enum(["all", "common", "uncommon", "rare", "epic", "legendary"])
    .default("all"),
  search: z.string().optional(),
  sourceId: z.string().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/items");
  }
  const params = parseResult.data;

  if (params.id) {
    const item = await items.findPublicItemById(params.id);
    if (!item) redirect("/items");
    if (item) redirect(getItemUrl(item));
  }

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(sourcesQueryOptions()),
    queryClient.prefetchInfiniteQuery(publicItemsInfiniteQueryOptions(params)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ItemsListView />
    </HydrationBoundary>
  );
}

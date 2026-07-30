import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import BuildItemView from "@/app/items/BuildItemView";
import { getQueryClient } from "@/lib/queryClient";
import { itemsService } from "@/lib/services/items";
import { sourcesQueryOptions } from "@/lib/services/sources";
import { deslugify } from "@/lib/utils/slug";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string }>;
}) {
  const { remix: remixSlug } = await searchParams;

  let sourceItem = null;
  let remixId: string | undefined;
  if (remixSlug) {
    const uuid = deslugify(remixSlug);
    if (uuid) {
      remixId = uuid;
      sourceItem = await itemsService.getItem(uuid);
      if (!sourceItem) {
        remixId = undefined;
        sourceItem = null;
      }
    }
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(sourcesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildItemView
        existingItem={sourceItem || undefined}
        remixedFromId={remixId}
      />
    </HydrationBoundary>
  );
}

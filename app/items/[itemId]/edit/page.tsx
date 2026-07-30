import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildItemView from "@/app/items/BuildItemView";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { itemsService } from "@/lib/services/items";
import { sourcesQueryOptions } from "@/lib/services/sources";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getItemEditUrl } from "@/lib/utils/url";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(itemId);
  if (!uid) return notFound();
  const item = await itemsService.getItemWithCreator(uid, session?.user.id);
  if (!item) return notFound();

  if (itemId !== slugify(item)) {
    return permanentRedirect(getItemEditUrl(item));
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(sourcesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildItemView item={item} />
    </HydrationBoundary>
  );
}

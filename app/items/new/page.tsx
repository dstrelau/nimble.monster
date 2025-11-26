import BuildItemView from "@/app/items/BuildItemView";
import { itemsService } from "@/lib/services/items";
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

  return (
    <BuildItemView
      existingItem={sourceItem || undefined}
      remixedFromId={remixId}
    />
  );
}

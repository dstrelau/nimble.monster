import { ItemsListView } from "@/app/ui/ItemsListView";
import { itemsService } from "@/lib/services/items";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const selectedId = params.id;

  const items = await itemsService.listPublicItems();

  return (
    <div className="container mx-auto py-3">
      <ItemsListView items={items} initialSelectedId={selectedId} />
    </div>
  );
}

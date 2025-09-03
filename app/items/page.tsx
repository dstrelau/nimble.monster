import { ItemsListView } from "@/app/ui/ItemsListView";
import * as db from "@/lib/db";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const selectedId = params.id;

  const items = await db.listPublicItems();

  return (
    <div className="container mx-auto py-3">
      <ItemsListView items={items} initialSelectedId={selectedId} />
    </div>
  );
}

import { CollectionsListView } from "@/app/ui/collection/CollectionsListView";
import * as db from "@/lib/db";

export default async function CollectionsPage() {
  const collections = await db.listPublicCollectionsHavingMonsters();

  if (collections?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No public collections available yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3">
      <CollectionsListView collections={collections} />
    </div>
  );
}

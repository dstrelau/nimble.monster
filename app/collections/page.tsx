import { CollectionCard } from "@/app/ui/CollectionCard";
import * as db from "@/lib/db";

export default async function CollectionsPage() {
  const collections = await db.listPublicCollections();
  if (collections?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No public collections available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            showEditDeleteButtons={false}
            showVisibilityBadge={false}
            showAttribution={true}
          />
        ))}
      </div>
    </div>
  );
}

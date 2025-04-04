import { CollectionOverview } from "@/lib/types";
import { CollectionCard } from "@/ui/CollectionCard";
import { PrismaClient } from "@/lib/prisma";

export default async function CollectionsPage() {
  const prisma = new PrismaClient();
  const dbcollections = await prisma.collection.findMany({
    where: { visibility: "public" },
    include: {
      creator: true,
      monsterCollections: { include: { monster: true } },
    },
    orderBy: { name: "asc" },
  });
  const collections = dbcollections.map((c): CollectionOverview => {
    const legendaryCount = c.monsterCollections.filter(
      (m) => m.monster.legendary,
    ).length;
    return {
      ...c,
      legendaryCount,
      standardCount: c.monsterCollections.length,
      creator: { ...c.creator, avatar: c.creator.avatar || "" },
    };
  });

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
            showPublicBadge={false}
          />
        ))}
      </div>
    </div>
  );
}

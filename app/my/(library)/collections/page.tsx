import { notFound } from "next/navigation";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyCollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const collections = await db.listCollectionsWithMonstersForUser(
    session.user.discordId
  );
  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.collection}
        title="My Collections"
        newHref="/collections/new"
        newLabel="New Collection"
      />
      {collections.length === 0 ? (
        <EmptyState entityName="collections" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
}

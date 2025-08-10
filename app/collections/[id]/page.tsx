import { notFound } from "next/navigation";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { CollectionHeader } from "@/components/CollectionHeader";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function ShowCollectionView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await db.getCollection(id);
  const session = await auth();
  if (!collection) {
    notFound();
  }
  if (
    collection.visibility === "private" &&
    collection.creator.discordId !== session?.user.id
  ) {
    notFound();
  }

  const isCreator = session?.user?.id === collection.creator.discordId;

  return (
    <div className="container">
      <CollectionHeader
        collection={collection}
        showEditDeleteButtons={isCreator}
      />
      {collection.monsters.length === 0 ? (
        <p>No monsters in this collection.</p>
      ) : (
        <CardGrid
          monsters={collection.monsters}
          currentUserId={session?.user?.id}
        />
      )}
    </div>
  );
}

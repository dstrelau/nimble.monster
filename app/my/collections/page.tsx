import { notFound } from "next/navigation";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MyCollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const collections = await db.listCollectionsWithMonstersForUser(
    session.user.discordId
  );
  return (
    <div className="space-y-6">
      {collections.length === 0 ? (
        <CreateEmptyState href="/collections/new" entityName="Collection" />
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

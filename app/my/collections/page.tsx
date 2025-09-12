import { notFound } from "next/navigation";
import { CollectionCard } from "@/app/ui/CollectionCard";
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
        <div className="d-alert d-alert-info">
          <p>
            No collections yet. Create your first collection to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              showVisibilityBadge={true}
              showAttribution={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

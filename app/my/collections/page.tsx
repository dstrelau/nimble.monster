import { CollectionCard } from "@/ui/CollectionCard";
import * as db from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import NewCollectionForm from "./NewCollectionForm";

export default async function MyCollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const collections = await db.listCollectionsForUser(session.user.id);
  return (
    <div className="space-y-6">
      <NewCollectionForm />

      {collections.length === 0 ? (
        <div className="d-alert d-alert-info">
          <p>
            No collections yet. Create your first collection to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              showEditDeleteButtons={true}
              showPublicBadge={c.visibility === "public"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

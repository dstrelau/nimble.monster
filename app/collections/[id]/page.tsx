import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { Attribution } from "@/ui/Attribution";
import { MonsterCardGrid } from "@/ui/MonsterCard";
import { notFound } from "next/navigation";

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
    collection.visibility == "private" &&
    collection.creator.discordId !== session?.user.id
  ) {
    notFound();
  }

  return (
    <div className="container">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {collection.name}
          </h2>
          <div className="mt-2">
            <Attribution user={collection.creator} />
          </div>
          {collection.description && (
            <div className="mt-2 text-gray-600">{collection.description}</div>
          )}
        </div>
        <details className="d-dropdown d-dropdown-end">
          <summary className="d-btn d-btn-outline d-btn-secondary">
            Export
          </summary>
          <div className="d-dropdown-content bg-base-100 z-1 w-48 shadow-sm">
            <a
              className="p-2 block hover:bg-base-200"
              href={`/api/collections/${id}/download`}
              download={`collection-${id}.json`}
            >
              OBR Compendium
            </a>
          </div>
        </details>
      </div>
      {collection.monsters.length === 0 ? (
        <p>No monsters in this collection.</p>
      ) : (
        <MonsterCardGrid monsters={collection.monsters} showActions={false} />
      )}
    </div>
  );
}

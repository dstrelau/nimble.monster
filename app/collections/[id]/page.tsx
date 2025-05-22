import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { Attribution } from "@/ui/Attribution";
import { Dropdown } from "@/ui/components/dropdown";
import { CardGrid } from "@/ui/monster/CardGrid";
import { Share, FileJson } from "lucide-react";
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
    collection.visibility === "private" &&
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
        <Dropdown
          summary={
            <span>
              <Share className="w-5 h-5 text-base-content/50" />
            </span>
          }
          items={[
            {
              element: (
                <a
                  className="flex gap-2 items-center"
                  href={`/api/collections/${id}/download`}
                  download={`collection-${collection.id}.json`}
                >
                  <FileJson className="w-4 h-4" />
                  Export OBR Compendium JSON
                </a>
              ),
            },
          ]}
          position="bottom"
          alignment="end"
          menuClassName="min-w-72"
        />
      </div>
      {collection.monsters.length === 0 ? (
        <p>No monsters in this collection.</p>
      ) : (
        <CardGrid monsters={collection.monsters} showActions={false} />
      )}
    </div>
  );
}

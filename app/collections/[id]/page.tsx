import { FileJson, Share } from "lucide-react";
import { notFound } from "next/navigation";
import { Attribution } from "@/app/ui/Attribution";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:opacity-70">
            <Share className="w-5 h-5 text-base-content/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="min-w-72">
            <DropdownMenuItem asChild>
              <a
                className="flex gap-2 items-center"
                href={`/api/collections/${id}/download`}
                download={`collection-${collection.id}.json`}
              >
                <FileJson className="w-4 h-4" />
                Export OBR Compendium JSON
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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

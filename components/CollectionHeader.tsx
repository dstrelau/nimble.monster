"use client";
import { FileJson, Pencil, Share, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCollection } from "@/app/actions/collection";
import { Attribution } from "@/app/ui/Attribution";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import { TruncatedMarkdown } from "@/components/TruncatedMarkdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Collection } from "@/lib/types";

interface CollectionHeaderProps {
  collection: Collection;
  showEditDeleteButtons?: boolean;
  onDelete?: () => void;
}

export function CollectionHeader({
  collection,
  showEditDeleteButtons = false,
}: CollectionHeaderProps) {
  const router = useRouter();

  const [_isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteCollection(collection.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete collection");
      }

      router.push("/my/collections");
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Failed to delete collection. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between items-start mb-6">
      <div className="w-full">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <h1 className="text-3xl font-black">{collection.name}</h1>
            {collection.visibility === "private" && (
              <VisibilityBadge
                visibility={collection.visibility}
                className="my-1"
              />
            )}
          </div>
          <div className="flex gap-2">
            {showEditDeleteButtons && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/collections/${collection.id}/edit`}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="end"
                className="min-w-72"
              >
                <DropdownMenuItem asChild>
                  <a
                    className="flex gap-2 items-center"
                    href={`/api/collections/${collection.id}/download`}
                    download={`collection-${collection.id}.json`}
                  >
                    <FileJson className="w-4 h-4" />
                    Export OBR Compendium JSON
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {collection.creator && (
          <div className="mt-2 flex">
            <Attribution user={collection.creator} />
          </div>
        )}
        {collection.description && (
          <div className="mt-2">
            <TruncatedMarkdown
              content={collection.description}
              title={collection.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}

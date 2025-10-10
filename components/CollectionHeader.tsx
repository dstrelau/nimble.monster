"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCollection } from "@/app/actions/collection";
import { Attribution } from "@/app/ui/Attribution";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import { Button } from "@/components/ui/button";
import type { Collection, Condition } from "@/lib/types";
import { getCollectionEditUrl } from "@/lib/utils/url";
import { FormattedText } from "./FormattedText";

interface CollectionHeaderProps {
  collection: Collection;
  showEditDeleteButtons?: boolean;
  onDelete?: () => void;
  conditions: Condition[];
}

export function CollectionHeader({
  collection,
  showEditDeleteButtons = false,
  conditions,
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
                  <Link href={getCollectionEditUrl(collection)}>
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
          </div>
        </div>
        {collection.creator && (
          <div className="mt-2 flex">
            <Attribution user={collection.creator} />
          </div>
        )}
        {collection.description && (
          <FormattedText
            className="mt-2"
            content={collection.description}
            conditions={conditions}
          />
        )}
      </div>
    </div>
  );
}

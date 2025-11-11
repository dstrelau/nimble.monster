"use client";
import { Pencil, Share, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCollection } from "@/app/actions/collection";
import { Attribution } from "@/app/ui/Attribution";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Collection, Condition } from "@/lib/types";
import { getCollectionEditUrl, getCollectionExportUrl } from "@/lib/utils/url";
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
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleExportMarkdown = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(getCollectionExportUrl(collection));

      if (!response.ok) {
        throw new Error("Failed to export collection");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collection.name}-export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting collection:", error);
      alert("Failed to export collection. Please try again.");
    } finally {
      setIsDownloading(false);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDownloading}>
                  <Share className="size-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  Markdown (zip)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

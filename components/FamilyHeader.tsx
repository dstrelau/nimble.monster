"use client";
import DOMPurify from "isomorphic-dompurify";
import { Pencil, Trash2 } from "lucide-react";
import { marked } from "marked";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteFamily } from "@/app/actions/family";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { Attribution } from "@/app/ui/Attribution";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Family } from "@/lib/types";

interface FamilyHeaderProps {
  family: Family;
  showEditDeleteButtons?: boolean;
  onDelete?: () => void;
}

const descriptionTruncationLength = 500;

export function FamilyHeader({
  family,
  showEditDeleteButtons = false,
}: FamilyHeaderProps) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [_isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${family.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteFamily(family.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete family");
      }

      router.push("/my/families");
    } catch (error) {
      console.error("Error deleting family:", error);
      alert("Failed to delete family. Please try again.");
      setIsDeleting(false);
    }
  };

  const desc = family.description || "";
  const shouldTruncate = desc.length > descriptionTruncationLength;
  const truncatedDescription = shouldTruncate
    ? `${family.description?.substring(0, descriptionTruncationLength)}...`
    : family.description;

  const truncatedHtml = truncatedDescription
    ? DOMPurify.sanitize(
        marked(truncatedDescription, { async: false }) as string
      )
    : "";

  const fullHtml = family.description
    ? DOMPurify.sanitize(String(marked(family.description)))
    : "";

  return (
    <div className="flex justify-between items-start mb-6">
      <div className="w-full">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-black">{family.name}</h1>
          {showEditDeleteButtons && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/f/${family.id}/edit`}>
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
        {family.creator && (
          <div className="mt-2 flex">
            <Attribution user={family.creator} />
          </div>
        )}
        {family.description && (
          <div className="mt-2 prose prose-sm prose-neutral dark:prose-invert max-w-none">
            <div
              className="inline [&>*:last-child]:inline"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
              dangerouslySetInnerHTML={{ __html: truncatedHtml }}
            />
            {shouldTruncate && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto ml-1 align-baseline"
                  >
                    Read All
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-2xl overflow-y-scroll">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{family.name}</SheetTitle>
                  </SheetHeader>

                  <div
                    className="w-full p-4 prose prose-sm prose-neutral dark:prose-invert max-w-none"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
                    dangerouslySetInnerHTML={{ __html: fullHtml }}
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>
        )}
        {family.abilities && family.abilities.length > 0 && (
          <div className="mt-4 mx-6">
            <AbilityOverlay abilities={family.abilities} />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import DOMPurify from "isomorphic-dompurify";
import { Pencil } from "lucide-react";
import { marked } from "marked";
import Link from "next/link";
import { useState } from "react";

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
  showEditButton?: boolean;
  editHref?: string;
}

const descriptionTruncationLength = 500;

export function FamilyHeader({
  family,
  showEditButton = false,
  editHref,
}: FamilyHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
          <h2 className="text-2xl font-bold">{family.name}</h2>
          {showEditButton && editHref && (
            <Button variant="outline" size="sm" asChild>
              <Link href={editHref}>
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
        {family.creator && (
          <div className="mt-2">
            <Attribution user={family.creator} />
          </div>
        )}
        {family.description && (
          <div className="mt-2 prose prose-sm prose-orange max-w-none">
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
                    className="w-full p-4 prose prose-sm prose-orange max-w-none"
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

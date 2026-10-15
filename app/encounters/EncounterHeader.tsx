"use client";
import { Pencil, Shuffle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEncounter } from "@/app/%5Factions/deleteEncounter/contract";
import { EntityReactions } from "@/components/EntityReactions";
import { Attribution } from "@/components/shared/Attribution";
import { FormattedText } from "@/components/shared/FormattedText";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";
import type { Condition, Encounter } from "@/lib/types";
import { slugify } from "@/lib/utils/slug";
import { getEncounterEditUrl } from "@/lib/utils/url";

interface EncounterHeaderProps {
  encounter: Encounter;
  showEditDeleteButtons?: boolean;
  showRemixButton?: boolean;
  conditions: Condition[];
}

export function EncounterHeader({
  encounter,
  showEditDeleteButtons = false,
  showRemixButton = false,
  conditions,
}: EncounterHeaderProps) {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${encounter.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      await call(deleteEncounter, { id: encounter.id });
      router.push("/my/encounters");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? `Error deleting encounter: ${error.message}`
          : "Failed to delete encounter. Please try again."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between items-start mb-6">
      <div className="w-full">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="flex gap-2 items-center">
            <h1 className="text-3xl font-black">{encounter.name}</h1>
            {encounter.visibility === "private" && (
              <VisibilityBadge
                visibility={encounter.visibility}
                className="my-1"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <EntityReactions
              entityType="encounter"
              entityId={encounter.id}
              showLabel
            />
            {showEditDeleteButtons && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={getEncounterEditUrl(encounter)}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
            {showRemixButton && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/encounters/new?remix=${slugify(encounter)}`}>
                  <Shuffle className="w-4 h-4" />
                  Remix
                </Link>
              </Button>
            )}
          </div>
        </div>
        {encounter.creator && (
          <div className="mt-2 flex">
            <Attribution user={encounter.creator} />
          </div>
        )}
        {encounter.description && (
          <FormattedText
            className="mt-2"
            content={encounter.description}
            conditions={conditions}
          />
        )}
      </div>
    </div>
  );
}

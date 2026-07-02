"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEncounter } from "@/app/actions/encounter";
import { Attribution } from "@/app/ui/Attribution";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import { Button } from "@/components/ui/button";
import type { Condition, Encounter } from "@/lib/types";
import { getEncounterEditUrl } from "@/lib/utils/url";
import { FormattedText } from "./FormattedText";

interface EncounterHeaderProps {
  encounter: Encounter;
  showEditDeleteButtons?: boolean;
  conditions: Condition[];
}

export function EncounterHeader({
  encounter,
  showEditDeleteButtons = false,
  conditions,
}: EncounterHeaderProps) {
  const router = useRouter();

  const [_isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${encounter.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteEncounter(encounter.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete encounter");
      }

      router.push("/my/encounters");
    } catch (error) {
      console.error("Error deleting encounter:", error);
      alert("Failed to delete encounter. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between items-start mb-6">
      <div className="w-full">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <h1 className="text-3xl font-black">{encounter.name}</h1>
            {encounter.visibility === "private" && (
              <VisibilityBadge
                visibility={encounter.visibility}
                className="my-1"
              />
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            {showEditDeleteButtons && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={getEncounterEditUrl(encounter)}>
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

"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { deleteFamily } from "@/app/families/actions";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { Attribution } from "@/app/ui/Attribution";
import { Button } from "@/components/ui/button";
import { useConditions } from "@/lib/hooks/useConditions";
import type { FamilyOverview } from "@/lib/types";
import { FormattedText } from "../../components/FormattedText";

interface FamilyHeaderProps {
  family: FamilyOverview;
  showEditDeleteButtons?: boolean;
}

export function FamilyHeader({
  family,
  showEditDeleteButtons = false,
}: FamilyHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { allConditions: conditions } = useConditions({
    creatorId: session?.user.discordId,
  });

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

  return (
    <div className="flex justify-between items-start mb-6">
      <div className="w-full">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-black">{family.name}</h1>
          {showEditDeleteButtons && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/families/${family.id}/edit`}>
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
          <FormattedText
            className="mt-2"
            content={family.description}
            conditions={conditions}
          />
        )}
        {family.abilities && family.abilities.length > 0 && (
          <div className="mt-4 mx-6">
            <AbilityOverlay
              abilities={family.abilities}
              conditions={conditions}
            />
          </div>
        )}
      </div>
    </div>
  );
}

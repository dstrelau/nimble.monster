"use client";
import { useRouter } from "next/navigation";
import { deleteAncestry } from "@/app/%5Factions/deleteAncestry/contract";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { call } from "@/lib/contract";
import type { Ancestry } from "@/lib/services/ancestries";
import { getAncestryEditUrl } from "@/lib/utils/url";

interface AncestryDetailActionsProps {
  ancestry: Ancestry;
  isOwner: boolean;
}

export function AncestryDetailActions({
  ancestry,
  isOwner,
}: AncestryDetailActionsProps) {
  const router = useRouter();
  if (!ancestry?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getAncestryEditUrl(ancestry)}
      onDelete={async () => {
        try {
          const result = await call(deleteAncestry, { id: ancestry.id });
          router.refresh();
          return result;
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not delete the ancestry. Please try again.",
          };
        }
      }}
      redirectTo="/my/ancestries"
      entityType="ancestry"
      entityId={ancestry.id}
      entityLabel="Ancestry"
    />
  );
}

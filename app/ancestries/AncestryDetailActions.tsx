"use client";
import { deleteAncestry } from "@/app/actions/ancestry";
import { EntityDetailActions } from "@/components/EntityDetailActions";
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
  if (!ancestry?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getAncestryEditUrl(ancestry)}
      onDelete={() => deleteAncestry(ancestry.id)}
      redirectTo="/my/ancestries"
      entityType="ancestry"
      entityId={ancestry.id}
      entityLabel="Ancestry"
    />
  );
}

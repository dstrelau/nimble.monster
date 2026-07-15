"use client";
import { deleteCompanion } from "@/app/actions/companion";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import type { Companion } from "@/lib/types";
import { getCompanionEditUrl } from "@/lib/utils/url";

interface CompanionDetailActionsProps {
  companion: Companion;
  isOwner: boolean;
}

export function CompanionDetailActions({
  companion,
  isOwner,
}: CompanionDetailActionsProps) {
  if (!companion?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getCompanionEditUrl(companion)}
      onDelete={() => deleteCompanion(companion.id)}
      redirectTo="/my/companions"
      entityType="companion"
      entityId={companion.id}
      entityLabel="Companion"
    />
  );
}

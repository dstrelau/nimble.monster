"use client";
import { useRouter } from "next/navigation";
import { deleteCompanion } from "@/app/%5Factions/deleteCompanion/contract";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { call } from "@/lib/contract";
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
  const router = useRouter();
  if (!companion?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getCompanionEditUrl(companion)}
      onDelete={async () => {
        try {
          const result = await call(deleteCompanion, { id: companion.id });
          router.refresh();
          return result;
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not delete the companion. Please try again.",
          };
        }
      }}
      redirectTo="/my/companions"
      entityType="companion"
      entityId={companion.id}
      entityLabel="Companion"
    />
  );
}

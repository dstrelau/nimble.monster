"use client";
import { useRouter } from "next/navigation";
import { deleteBackground } from "@/app/%5Factions/deleteBackground/contract";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { call } from "@/lib/contract";
import type { Background } from "@/lib/services/backgrounds";
import { getBackgroundEditUrl } from "@/lib/utils/url";

interface BackgroundDetailActionsProps {
  background: Background;
  isOwner: boolean;
}

export function BackgroundDetailActions({
  background,
  isOwner,
}: BackgroundDetailActionsProps) {
  const router = useRouter();
  if (!background?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getBackgroundEditUrl(background)}
      onDelete={async () => {
        try {
          const result = await call(deleteBackground, { id: background.id });
          router.refresh();
          return result;
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not delete the background. Please try again.",
          };
        }
      }}
      redirectTo="/my/backgrounds"
      entityType="background"
      entityId={background.id}
      entityLabel="Background"
    />
  );
}

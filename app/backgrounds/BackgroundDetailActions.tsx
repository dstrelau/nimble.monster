"use client";
import { deleteBackground } from "@/app/actions/background";
import { EntityDetailActions } from "@/components/EntityDetailActions";
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
  if (!background?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getBackgroundEditUrl(background)}
      onDelete={() => deleteBackground(background.id)}
      redirectTo="/my/backgrounds"
      entityType="background"
      entityId={background.id}
      entityLabel="Background"
    />
  );
}

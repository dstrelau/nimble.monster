"use client";
import { deleteSubclass } from "@/app/actions/subclass";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import type { Subclass } from "@/lib/types";
import { getSubclassEditUrl } from "@/lib/utils/url";

interface SubclassDetailActionsProps {
  subclass: Subclass;
  isOwner: boolean;
}

export function SubclassDetailActions({
  subclass,
  isOwner,
}: SubclassDetailActionsProps) {
  if (!subclass?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getSubclassEditUrl(subclass)}
      onDelete={() => deleteSubclass(subclass.id)}
      redirectTo="/my/subclasses"
      entityType="subclass"
      entityId={subclass.id}
      entityLabel="Subclass"
    />
  );
}

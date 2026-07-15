"use client";
import { deleteClass } from "@/app/actions/class";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import type { Class } from "@/lib/types";
import { getClassEditUrl } from "@/lib/utils/url";

interface ClassDetailActionsProps {
  classEntity: Class;
  isOwner: boolean;
}

export function ClassDetailActions({
  classEntity,
  isOwner,
}: ClassDetailActionsProps) {
  if (!classEntity?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getClassEditUrl(classEntity)}
      onDelete={() => deleteClass(classEntity.id)}
      redirectTo="/my/classes"
      entityType="class"
      entityId={classEntity.id}
      entityLabel="Class"
    />
  );
}

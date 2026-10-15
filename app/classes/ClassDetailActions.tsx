"use client";
import { useRouter } from "next/navigation";
import { deleteClass } from "@/app/%5Factions/deleteClass/contract";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { call } from "@/lib/contract";
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
  const router = useRouter();
  if (!classEntity?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getClassEditUrl(classEntity)}
      onDelete={async () => {
        try {
          const result = await call(deleteClass, { id: classEntity.id });
          router.refresh();
          return result;
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not delete the class. Please try again.",
          };
        }
      }}
      redirectTo="/my/classes"
      entityType="class"
      entityId={classEntity.id}
      entityLabel="Class"
    />
  );
}

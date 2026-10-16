"use client";
import { useRouter } from "next/navigation";
import { deleteSubclass } from "@/app/%5Factions/deleteSubclass/contract";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { call } from "@/lib/contract";
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
  const router = useRouter();
  if (!subclass?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getSubclassEditUrl(subclass)}
      onDelete={async () => {
        try {
          const result = await call(deleteSubclass, { id: subclass.id });
          router.refresh();
          return result;
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not delete the subclass. Please try again.",
          };
        }
      }}
      redirectTo="/my/subclasses"
      entityType="subclass"
      entityId={subclass.id}
      entityLabel="Subclass"
    />
  );
}

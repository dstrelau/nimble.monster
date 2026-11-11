"use client";

import { Trash2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  type AwardEntityType,
  deleteAward,
  removeAwardAssociation,
} from "@/app/%5Factions/_award/contract";
import { deleteSource } from "@/app/%5Factions/_source/contract";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";

type AdminRowAction =
  | { kind: "deleteAward"; id: string }
  | { kind: "deleteSource"; id: string }
  | {
      kind: "removeAwardAssociation";
      entityType: AwardEntityType;
      entityId: string;
      awardId: string;
    };

const labels: Record<AdminRowAction["kind"], string> = {
  deleteAward: "Delete award",
  deleteSource: "Delete source",
  removeAwardAssociation: "Remove association",
};

function run(action: AdminRowAction) {
  switch (action.kind) {
    case "deleteAward":
      return call(deleteAward, { id: action.id });
    case "deleteSource":
      return call(deleteSource, { id: action.id });
    case "removeAwardAssociation":
      return call(removeAwardAssociation, {
        entityType: action.entityType,
        entityId: action.entityId,
        awardId: action.awardId,
      });
  }
}

export function AdminRowActionButton({ action }: { action: AdminRowAction }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icon = action.kind === "removeAwardAssociation" ? Unlink : Trash2;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive"
      aria-label={labels[action.kind]}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await run(action);
            router.refresh();
          } catch (error) {
            window.alert(
              error instanceof Error ? error.message : "Action failed"
            );
          }
        })
      }
    >
      <Icon className="size-4" />
    </Button>
  );
}

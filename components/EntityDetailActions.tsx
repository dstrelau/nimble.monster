"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useTransition } from "react";
import { ReportEntityDialog } from "@/components/ReportEntityDialog";
import { Button } from "@/components/ui/button";
import type { ReactableEntityType } from "@/lib/db/schema";

interface EntityDetailActionsProps {
  isOwner: boolean;
  editUrl: string;
  onDelete: () => Promise<{ success: boolean; error?: string | null }>;
  redirectTo: string;
  entityType: ReactableEntityType;
  entityId: string;
  entityLabel: string;
  children?: ReactNode;
}

export function EntityDetailActions({
  isOwner,
  editUrl,
  onDelete,
  redirectTo,
  entityType,
  entityId,
  entityLabel,
  children,
}: EntityDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await onDelete();
      if (!result.success && result.error) {
        alert(`Error deleting ${entityLabel.toLowerCase()}: ${result.error}`);
      } else if (result.success) {
        router.push(redirectTo);
      }
    });
  };

  return (
    <div className="flex gap-2">
      {isOwner && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={editUrl}>
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </>
      )}
      {children}
      <ReportEntityDialog
        entityType={entityType}
        entityId={entityId}
        entityLabel={entityLabel}
      />
    </div>
  );
}

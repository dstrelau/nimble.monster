"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteCompanion } from "@/app/actions/companion";
import { Button } from "@/components/ui/button";
import type { Companion } from "@/lib/types";

interface CompanionDetailActionsProps {
  companion: Companion;
}

export function CompanionDetailActions({
  companion,
}: CompanionDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!companion?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCompanion(companion.id);
      if (!result.success && result.error) {
        alert(`Error deleting companion: ${result.error}`);
      } else if (result.success) {
        router.push("/my/companions");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/my/companions/${companion.id}/edit`}>
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
    </div>
  );
}

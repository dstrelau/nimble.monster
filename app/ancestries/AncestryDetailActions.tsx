"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteAncestry } from "@/app/actions/ancestry";
import { Button } from "@/components/ui/button";
import type { Ancestry } from "@/lib/services/ancestries";
import { getAncestryEditUrl } from "@/lib/utils/url";

interface AncestryDetailActionsProps {
  ancestry: Ancestry;
}

export function AncestryDetailActions({
  ancestry,
}: AncestryDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!ancestry?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAncestry(ancestry.id);
      if (!result.success && result.error) {
        alert(`Error deleting ancestry: ${result.error}`);
      } else if (result.success) {
        router.push("/my/ancestries");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={getAncestryEditUrl(ancestry)}>
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

"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteSubclass } from "@/app/actions/subclass";
import { Button } from "@/components/ui/button";
import type { Subclass } from "@/lib/types";

interface SubclassDetailActionsProps {
  subclass: Subclass;
}

export function SubclassDetailActions({
  subclass,
}: SubclassDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!subclass?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSubclass(subclass.id);
      if (!result.success && result.error) {
        alert(`Error deleting subclass: ${result.error}`);
      } else if (result.success) {
        router.push("/my/subclasses");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/my/subclasses/${subclass.id}/edit`}>
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

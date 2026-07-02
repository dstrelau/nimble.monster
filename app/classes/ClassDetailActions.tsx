"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteClass } from "@/app/actions/class";
import { Button } from "@/components/ui/button";
import type { Class } from "@/lib/types";
import { getClassEditUrl } from "@/lib/utils/url";

interface ClassDetailActionsProps {
  classEntity: Class;
}

export function ClassDetailActions({ classEntity }: ClassDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!classEntity?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteClass(classEntity.id);
      if (!result.success && result.error) {
        alert(`Error deleting class: ${result.error}`);
      } else if (result.success) {
        router.push("/my/classes");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={getClassEditUrl(classEntity)}>
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

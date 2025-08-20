"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMonster } from "@/app/actions/monster";
import { Button } from "@/components/ui/button";
import type { Monster } from "@/lib/types";

interface MonsterDetailActionsProps {
  monster: Monster;
}

export function MonsterDetailActions({ monster }: MonsterDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!monster?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteMonster(monster.id);
      if (!result.success && result.error) {
        alert(`Error deleting monster: ${result.error}`);
      } else if (result.success) {
        router.push("/my/monsters");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/my/monsters/${monster.id}/edit`}>
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

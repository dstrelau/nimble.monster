"use client";
import { Pencil, Shuffle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMonster } from "@/app/actions/monster";
import { Button } from "@/components/ui/button";
import type { Monster } from "@/lib/services/monsters";
import { slugify } from "@/lib/utils/slug";
import { getMonsterEditUrl } from "@/lib/utils/url";

interface MonsterDetailActionsProps {
  monster: Monster;
  isOwner: boolean;
}

export function MonsterDetailActions({
  monster,
  isOwner,
}: MonsterDetailActionsProps) {
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
      {isOwner && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={getMonsterEditUrl(monster)}>
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
      <Button variant="outline" size="sm" asChild>
        <Link href={`/monsters/new?remix=${slugify(monster)}`}>
          <Shuffle className="w-4 h-4" />
          Remix
        </Link>
      </Button>
    </div>
  );
}

"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteClassAbilityList } from "@/app/actions/classAbilityList";
import { Button } from "@/components/ui/button";
import type { ClassAbilityList } from "@/lib/types";
import { getClassAbilityListEditUrl } from "@/lib/utils/url";

interface ClassAbilityListDetailActionsProps {
  abilityList: ClassAbilityList;
}

export function ClassAbilityListDetailActions({
  abilityList,
}: ClassAbilityListDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!abilityList?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteClassAbilityList(abilityList.id);
      if (!result.success && result.error) {
        alert(`Error deleting class options: ${result.error}`);
      } else if (result.success) {
        router.push("/my/class-options");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={getClassAbilityListEditUrl(abilityList)}>
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

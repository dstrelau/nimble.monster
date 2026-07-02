"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteBackground } from "@/app/actions/background";
import { Button } from "@/components/ui/button";
import type { Background } from "@/lib/services/backgrounds";
import { getBackgroundEditUrl } from "@/lib/utils/url";

interface BackgroundDetailActionsProps {
  background: Background;
}

export function BackgroundDetailActions({
  background,
}: BackgroundDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!background?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteBackground(background.id);
      if (!result.success && result.error) {
        alert(`Error deleting background: ${result.error}`);
      } else if (result.success) {
        router.push("/my/backgrounds");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={getBackgroundEditUrl(background)}>
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

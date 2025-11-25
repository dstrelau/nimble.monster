"use client";
import { Pencil, Shuffle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteItem } from "@/app/actions/item";
import { Button } from "@/components/ui/button";
import type { Item } from "@/lib/services/items";
import { slugify } from "@/lib/utils/slug";
import { getItemEditUrl } from "@/lib/utils/url";

interface ItemDetailActionsProps {
  item: Item;
  isOwner: boolean;
}

export function ItemDetailActions({ item, isOwner }: ItemDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!item?.id) {
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm("Really? This is permanent.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (!result.success && result.error) {
        alert(`Error deleting item: ${result.error}`);
      } else if (result.success) {
        router.push("/my/items");
      }
    });
  };

  return (
    <div className="flex gap-2">
      {isOwner && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={getItemEditUrl(item)}>
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
        <Link href={`/items/new?remix=${slugify(item)}`}>
          <Shuffle className="w-4 h-4" />
          Remix
        </Link>
      </Button>
    </div>
  );
}

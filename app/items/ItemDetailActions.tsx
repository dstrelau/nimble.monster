"use client";
import { Shuffle } from "lucide-react";
import Link from "next/link";
import { deleteItem } from "@/app/actions/item";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { Button } from "@/components/ui/button";
import type { Item } from "@/lib/services/items";
import { slugify } from "@/lib/utils/slug";
import { getItemEditUrl } from "@/lib/utils/url";

interface ItemDetailActionsProps {
  item: Item;
  isOwner: boolean;
}

export function ItemDetailActions({ item, isOwner }: ItemDetailActionsProps) {
  if (!item?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getItemEditUrl(item)}
      onDelete={() => deleteItem(item.id)}
      redirectTo="/my/items"
      entityType="item"
      entityId={item.id}
      entityLabel="Item"
    >
      <Button variant="outline" size="sm" asChild>
        <Link href={`/items/new?remix=${slugify(item)}`}>
          <Shuffle className="w-4 h-4" />
          Remix
        </Link>
      </Button>
    </EntityDetailActions>
  );
}

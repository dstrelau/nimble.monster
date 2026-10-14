"use client";
import { Shuffle } from "lucide-react";
import Link from "next/link";
import { deleteItem } from "@/app/%5Factions/deleteItem/contract";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";
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
      onDelete={async () => {
        try {
          return await call(deleteItem, { id: item.id });
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not delete the item. Please try again.",
          };
        }
      }}
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

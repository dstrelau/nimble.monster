"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type { ItemRarity, ItemRarityFilter } from "@/lib/types";

export type { ItemRarityFilter };

export async function searchPublicItems(params: {
  creatorId?: string;
  searchTerm?: string;
  rarity?: ItemRarityFilter;
  sortBy?: "name" | "rarity";
  sortDirection?: "asc" | "desc";
  limit?: number;
}) {
  try {
    const items = await db.searchPublicItemMinis(params);
    return { success: true, items };
  } catch (error) {
    console.error("Error searching public items:", error);
    return { success: false, error: "Failed to search items" };
  }
}

export async function createItem(formData: {
  name: string;
  kind?: string;
  description: string;
  moreInfo?: string;
  imageIcon?: string;
  rarity?: ItemRarity;
  visibility: "public" | "private";
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const item = await db.createItem({
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath("/my/items");

    return { success: true, item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateItem(
  itemId: string,
  formData: {
    name: string;
    kind?: string;
    description: string;
    moreInfo?: string;
    imageIcon?: string;
    rarity?: ItemRarity;
    visibility: "public" | "private";
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const item = await db.updateItem({
      id: itemId,
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath(`/items/${itemId}`);
    revalidatePath("/my/items");

    return { success: true, item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function findPublicItem(itemId: string) {
  try {
    const item = await db.findPublicItemById(itemId);
    if (!item) {
      return { success: false, error: "Item not found", item: null };
    }

    return { success: true, error: null, item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      item: null,
    };
  }
}

export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteItem({
    id: itemId,
    discordId: session.user.discordId,
  });

  if (deleted) {
    revalidatePath("/my/items");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the item. Please try again.",
  };
}

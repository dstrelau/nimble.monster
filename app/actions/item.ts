"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { ItemRarity, ItemRarityFilter } from "@/lib/services/items";
import { itemsService } from "@/lib/services/items";
import { getItemUrl } from "@/lib/utils/url";

// export async function searchPublicItems(params: {
//   creatorId?: string;
//   searchTerm?: string;
//   rarity?: ItemRarityFilter;
//   sortBy?: "name" | "rarity";
//   sortDirection?: "asc" | "desc";
//   limit?: number;
// }) {
//   try {
//     const items = await itemsService.searchItems(params);
//     return { success: true, items };
//   } catch (error) {
//     console.error("Error searching public items:", error);
//     return { success: false, error: "Failed to search items" };
//   }
// }

// export async function loadMoreItems(params: {
//   searchTerm?: string;
//   rarity?: ItemRarity | "all";
//   sort?: "name" | "-name" | "created" | "-created";
//   offset: number;
//   limit?: number;
// }) {
//   try {
//     const {
//       searchTerm,
//       rarity,
//       sort = "-created",
//       offset,
//       limit = 20,
//     } = params;

//     const isDesc = sort.startsWith("-");
//     const field = isDesc ? sort.slice(1) : sort;
//     const sortBy =
//       field === "name" ? "name" : field === "rarity" ? "rarity" : undefined;
//     const sortDirection = isDesc ? "desc" : "asc";

//     const items = await itemsService.searchPublicItems({
//       searchTerm: searchTerm || undefined,
//       rarity: rarity === "all" ? undefined : rarity,
//       sortBy,
//       sortDirection,
//       limit: limit + 1,
//       offset,
//     });

//     const hasMore = items.length > limit;
//     const paginatedItems = items.slice(0, limit);

//     return { success: true, items: paginatedItems, hasMore };
//   } catch (error) {
//     console.error("Error loading more items:", error);
//     return {
//       success: false,
//       error: "Failed to load more items",
//       items: [],
//       hasMore: false,
//     };
//   }
// }

export async function createItem(formData: {
  name: string;
  kind?: string;
  description: string;
  moreInfo?: string;
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  imageBgColor?: string;
  rarity?: ItemRarity;
  visibility: "public" | "private";
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const item = await itemsService.createItem(
      formData,
      session.user.discordId
    );

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
    imageBgIcon?: string;
    imageColor?: string;
    imageBgColor?: string;
    rarity?: ItemRarity;
    visibility: "public" | "private";
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const item = await itemsService.updateItem(
      itemId,
      formData,
      session.user.discordId
    );

    revalidatePath(getItemUrl(item));
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
    const item = await itemsService.getPublicItem(itemId);
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

  const deleted = await itemsService.deleteItem(itemId, session.user.discordId);

  if (deleted) {
    revalidatePath("/my/items");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the item. Please try again.",
  };
}

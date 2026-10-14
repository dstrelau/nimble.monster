"use server";

import { itemsService } from "@/lib/services/items";

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

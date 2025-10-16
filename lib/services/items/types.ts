import type { Source, User } from "@/lib/types";

export const RARITIES = [
  { value: "unspecified", label: "Unspecified" },
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "very_rare", label: "Very Rare" },
  { value: "legendary", label: "Legendary" },
] as const;

export type ItemRarity = (typeof RARITIES)[number]["value"];
export type ItemRarityFilter = "all" | ItemRarity;

export interface ItemMini {
  id: string;
  name: string;
  kind?: string;
  rarity: ItemRarity;
  visibility: "public" | "private";
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  imageBgColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item extends ItemMini {
  description: string;
  moreInfo?: string;
  creator: User;
  source?: Source;
}

export type ItemSortBy = "name" | "createdAt";
export type ItemSortDirection = "asc" | "desc";

export interface SearchItemsParams {
  searchTerm?: string;
  rarity?: ItemRarityFilter;
  creatorId?: string;
  sortBy?: ItemSortBy;
  sortDirection?: ItemSortDirection;
  limit?: number;
}

export interface CreateItemInput {
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
  sourceId?: string;
}

export interface UpdateItemInput {
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
  sourceId?: string;
}

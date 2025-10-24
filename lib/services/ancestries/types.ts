import type { Award, Source, User } from "@/lib/types";

export const SIZES = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
] as const;

export const RARITIES = [
  { value: "common", label: "Common" },
  { value: "exotic", label: "Exotic" },
] as const;

export type AncestrySize = (typeof SIZES)[number]["value"];
export type AncestryRarity = (typeof RARITIES)[number]["value"];

export interface AncestryAbility {
  name: string;
  description: string;
}

export interface AncestryMini {
  id: string;
  name: string;
  size: AncestrySize[];
  rarity: AncestryRarity;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ancestry extends AncestryMini {
  description: string;
  abilities: AncestryAbility[];
  creator: User;
  source?: Source;
  awards?: Award[];
}

export type AncestrySortBy = "name" | "createdAt";
export type AncestrySortDirection = "asc" | "desc";

export interface SearchAncestriesParams {
  searchTerm?: string;
  creatorId?: string;
  sourceId?: string;
  sortBy?: AncestrySortBy;
  sortDirection?: AncestrySortDirection;
  limit?: number;
}

export interface CreateAncestryInput {
  name: string;
  description: string;
  size: AncestrySize[];
  rarity: AncestryRarity;
  abilities: AncestryAbility[];
  sourceId?: string;
}

export interface UpdateAncestryInput {
  name: string;
  description: string;
  size: AncestrySize[];
  rarity: AncestryRarity;
  abilities: AncestryAbility[];
  sourceId?: string;
}

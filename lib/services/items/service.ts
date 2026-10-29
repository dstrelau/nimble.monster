import { z } from "zod";
import { searchPublicItems } from "./public-search";
import * as repository from "./repository";
import {
  type CreateItemInput,
  type Item,
  type PaginateItemsParams,
  PaginateItemsSortOptions,
  type UpdateItemInput,
} from "./types";

const RarityOptions = [
  "all",
  "unspecified",
  "common",
  "uncommon",
  "rare",
  "very_rare",
  "legendary",
] as const;

const PaginateItemsSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateItemsSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(100),
  cursor: z.string().optional(),
  rarity: z.enum(RarityOptions).optional(),
  creatorId: z.string().optional(),
  source: z.string().optional(),
});

export type PaginatePublicItemsResponse = {
  data: Item[];
  nextCursor: string | null;
};

export const PublicItemPageSchema = PaginateItemsSchema.omit({
  cursor: true,
}).extend({
  limit: z.number().int().min(1).max(100).default(12),
  pageParam: z
    .number()
    .int()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER / 100)
    .default(0),
});
export type PublicItemPageInput = Omit<
  z.input<typeof PublicItemPageSchema>,
  "sort" | "rarity"
> & { sort?: string; rarity?: string };
export interface PublicItemPageResponse {
  data: Item[];
  hasMore: boolean;
}

export class ItemsService {
  async publicItemPage(
    params: PublicItemPageInput
  ): Promise<PublicItemPageResponse> {
    const parsed = PublicItemPageSchema.parse(params);
    const descending = parsed.sort.startsWith("-");
    const field = descending ? parsed.sort.slice(1) : parsed.sort;
    const data = await searchPublicItems({
      searchTerm: parsed.search || undefined,
      sortBy:
        field === "name" ? "name" : field === "likes" ? "likes" : "createdAt",
      sortDirection: descending ? "desc" : "asc",
      rarity: parsed.rarity,
      source: parsed.source,
      creatorId: parsed.creatorId,
      limit: parsed.limit + 1,
      offset: parsed.pageParam * parsed.limit,
    });
    return {
      data: data.slice(0, parsed.limit),
      hasMore: data.length > parsed.limit,
    };
  }

  async paginatePublicItems(
    params: PaginateItemsParams
  ): Promise<PaginatePublicItemsResponse> {
    const parsedParams = PaginateItemsSchema.parse(params);
    return repository.paginateItems({
      includePrivate: false,
      ...parsedParams,
    });
  }

  async paginateMyItems(
    userId: string,
    params: PaginateItemsParams
  ): Promise<PaginatePublicItemsResponse> {
    const parsedParams = PaginateItemsSchema.parse(params);
    return repository.paginateItems({
      includePrivate: true,
      creatorId: userId,
      ...parsedParams,
    });
  }

  async getPublicItem(itemId: string): Promise<Item | null> {
    return repository.findPublicItemById(itemId);
  }

  async getItem(itemId: string): Promise<Item | null> {
    return repository.findItem(itemId);
  }

  async getItemWithCreator(
    itemId: string,
    userId: string
  ): Promise<Item | null> {
    return repository.findItemWithCreatorDiscordId(itemId, userId);
  }

  async listPublicItemsForUser(userId: string): Promise<Item[]> {
    return repository.listPublicItemsForUser(userId);
  }

  async getRandomRecentItems(limit?: number): Promise<Item[]> {
    return repository.getRandomRecentItems(limit);
  }

  async listItemsForUser(discordId: string): Promise<Item[]> {
    return repository.listAllItemsForDiscordID(discordId);
  }

  async getItemCollections(itemId: string) {
    return repository.findItemCollections(itemId);
  }

  async getItemRemixes(itemId: string) {
    return repository.findItemRemixes(itemId);
  }

  async createItem(
    input: CreateItemInput,
    creatorDiscordId: string
  ): Promise<Item> {
    if (!creatorDiscordId) {
      throw new Error("Creator Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Item name is required");
    }

    return repository.createItem(input, creatorDiscordId);
  }

  async updateItem(
    itemId: string,
    input: UpdateItemInput,
    userDiscordId: string
  ): Promise<Item> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Item name is required");
    }

    return repository.updateItem(itemId, input, userDiscordId);
  }

  async deleteItem(itemId: string, userDiscordId: string): Promise<boolean> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    return repository.deleteItem(itemId, userDiscordId);
  }
}

export const itemsService = new ItemsService();

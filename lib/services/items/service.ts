import * as repository from "./repository";
import type {
  CreateItemInput,
  Item,
  ItemMini,
  SearchItemsParams,
  UpdateItemInput,
} from "./types";

export class ItemsService {
  async getItem(
    itemId: string,
    options?: { userId?: string }
  ): Promise<Item | null> {
    if (options?.userId) {
      return repository.findItemWithCreatorDiscordId(itemId, options.userId);
    }
    return repository.findPublicItemById(itemId);
  }

  async searchItems(params: SearchItemsParams): Promise<ItemMini[]> {
    return repository.searchPublicItemMinis(params);
  }

  async listPublicItems(): Promise<Item[]> {
    return repository.listPublicItems();
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

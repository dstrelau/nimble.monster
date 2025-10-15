import * as repository from "./repository";
import type { CreateItemInput, Item, UpdateItemInput } from "./types";

export class ItemsService {
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

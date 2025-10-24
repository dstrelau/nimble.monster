import { z } from "zod";
import * as repository from "./repository";
import type {
  Background,
  CreateBackgroundInput,
  SearchBackgroundsParams,
  UpdateBackgroundInput,
} from "./types";

const PaginateBackgroundsSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

const PaginateBackgroundsSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateBackgroundsSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  creatorId: z.string().optional(),
  sourceId: z.string().optional(),
});

export type PaginateBackgroundsParams = z.infer<
  typeof PaginateBackgroundsSchema
>;

export type PaginatePublicBackgroundsResponse = {
  data: Background[];
  nextCursor: string | null;
};

export class BackgroundsService {
  async getBackground(id: string): Promise<Background | null> {
    return repository.findBackground(id);
  }

  async paginatePublicBackgrounds(
    params: PaginateBackgroundsParams
  ): Promise<PaginatePublicBackgroundsResponse> {
    const parsedParams = PaginateBackgroundsSchema.parse(params);
    return repository.paginatePublicBackgrounds(parsedParams);
  }

  async searchBackgrounds(
    params: SearchBackgroundsParams
  ): Promise<Background[]> {
    return repository.searchPublicBackgrounds(params);
  }

  async listBackgroundsForUser(discordId: string): Promise<Background[]> {
    return repository.listAllBackgroundsForDiscordID(discordId);
  }

  async createBackground(
    input: CreateBackgroundInput,
    creatorDiscordId: string
  ): Promise<Background> {
    if (!creatorDiscordId) {
      throw new Error("Creator Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Background name is required");
    }

    return repository.createBackground(input, creatorDiscordId);
  }

  async updateBackground(
    id: string,
    input: UpdateBackgroundInput,
    userDiscordId: string
  ): Promise<Background> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Background name is required");
    }

    return repository.updateBackground(id, input, userDiscordId);
  }

  async deleteBackground(
    backgroundId: string,
    userDiscordId: string
  ): Promise<boolean> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    return repository.deleteBackground(backgroundId, userDiscordId);
  }
}

export const backgroundsService = new BackgroundsService();

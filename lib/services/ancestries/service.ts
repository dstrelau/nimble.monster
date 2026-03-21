import { z } from "zod";
import * as repository from "./repository";
import {
  type Ancestry,
  type CreateAncestryInput,
  type PaginateAncestriesParams,
  PaginateAncestriesSortOptions,
  type PaginatePublicAncestriesResponse,
  type SearchAncestriesParams,
  type UpdateAncestryInput,
} from "./types";

// Re-export pagination types for backwards compatibility
export type { PaginateAncestriesParams, PaginatePublicAncestriesResponse };

const PaginateAncestriesSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateAncestriesSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  creatorId: z.string().optional(),
  sourceId: z.string().optional(),
});

export class AncestriesService {
  async getAncestry(id: string): Promise<Ancestry | null> {
    return repository.findAncestry(id);
  }

  async paginatePublicAncestries(
    params: PaginateAncestriesParams
  ): Promise<PaginatePublicAncestriesResponse> {
    const parsedParams = PaginateAncestriesSchema.parse(params);
    return repository.paginatePublicAncestries(parsedParams);
  }

  async searchAncestries(params: SearchAncestriesParams): Promise<Ancestry[]> {
    return repository.searchPublicAncestries(params);
  }

  async listAncestriesForUser(discordId: string): Promise<Ancestry[]> {
    return repository.listAllAncestriesForDiscordID(discordId);
  }

  async createAncestry(
    input: CreateAncestryInput,
    creatorDiscordId: string
  ): Promise<Ancestry> {
    if (!creatorDiscordId) {
      throw new Error("Creator Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Ancestry name is required");
    }

    return repository.createAncestry(input, creatorDiscordId);
  }

  async updateAncestry(
    id: string,
    input: UpdateAncestryInput,
    userDiscordId: string
  ): Promise<Ancestry> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Ancestry name is required");
    }

    return repository.updateAncestry(id, input, userDiscordId);
  }

  async deleteAncestry(
    ancestryId: string,
    userDiscordId: string
  ): Promise<boolean> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    return repository.deleteAncestry(ancestryId, userDiscordId);
  }
}

export const ancestriesService = new AncestriesService();

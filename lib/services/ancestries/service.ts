import { z } from "zod";
import * as repository from "./repository";
import type {
  Ancestry,
  CreateAncestryInput,
  SearchAncestriesParams,
  UpdateAncestryInput,
} from "./types";

const PaginateAncestriesSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

const PaginateAncestriesSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateAncestriesSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  creatorId: z.string().optional(),
  source: z.string().optional(),
});

export type PaginateAncestriesParams = z.infer<typeof PaginateAncestriesSchema>;

export type PaginatePublicAncestriesResponse = {
  data: Ancestry[];
  nextCursor: string | null;
};

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

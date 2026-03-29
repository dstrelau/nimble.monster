import { z } from "zod";
import type { Source } from "@/lib/types";
import * as repository from "./repository";
import {
  type CreateMonsterInput,
  type Monster,
  type MonsterMini,
  MonsterRoleOptions,
  MonsterTypeOptions,
  PaginateMonstersSortOptions,
  type SearchMonstersParams,
  type UpdateMonsterInput,
} from "./types";

const PaginateMonstersSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateMonstersSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  type: z.enum(MonsterTypeOptions).optional(),
  creatorId: z.string().optional(),
  sourceId: z.string().optional(),
  role: z.enum(MonsterRoleOptions).optional(),
  level: z.number().optional(),
});

export type PaginateMonstersParams = z.infer<typeof PaginateMonstersSchema>;

export type PaginatePublicMonstersResponse = {
  data: Monster[];
  nextCursor: string | null;
};

export class MonstersService {
  async getPublicMonster(id: string): Promise<Monster | null> {
    return repository.findPublicMonsterById(id);
  }

  async getPublicOrPrivateMonsterForUser(id: string, discordId: string | undefined): Promise<Monster | null> {
    const monster = await repository.findMonster(id);
    if (!monster) return null;
    if (monster.visibility === "private") {
      if(monster.creator.discordId !== undefined && monster.creator.discordId === discordId) return monster;
      return null;
    }
    return monster;
  }

  async getMonster(monsterId: string): Promise<Monster | null> {
    return repository.findMonster(monsterId);
  }

  async paginatePublicMonsters(
    params: PaginateMonstersParams
  ): Promise<PaginatePublicMonstersResponse> {
    const parsedParams = PaginateMonstersSchema.parse(params);
    return repository.paginateMonsters({
      includePrivate: false,
      ...parsedParams,
    });
  }

  async paginateMyMonsters(
    creatorId: string,
    params: PaginateMonstersParams
  ): Promise<PaginatePublicMonstersResponse> {
    const parsedParams = PaginateMonstersSchema.parse(params);
    return repository.paginateMonsters({
      includePrivate: true,
      creatorId,
      ...parsedParams,
    });
  }

  async searchMonsters(params: SearchMonstersParams): Promise<MonsterMini[]> {
    return repository.searchPublicMonsterMinis(params);
  }

  async listPublicMonstersForUser(userId: string): Promise<Monster[]> {
    return repository.listPublicMonstersForUser(userId);
  }

  async listMonstersForUser(discordId: string): Promise<Monster[]> {
    return repository.listAllMonstersForDiscordID(discordId);
  }

  async listMonstersByFamily(familyId: string): Promise<Monster[]> {
    return repository.listMonstersByFamilyId(familyId);
  }

  async getMonsterCollections(monsterId: string) {
    return repository.findMonsterCollections(monsterId);
  }

  async getMonsterRemixes(monsterId: string) {
    return repository.findMonsterRemixes(monsterId);
  }

  async createMonster(
    input: CreateMonsterInput,
    creatorDiscordId: string
  ): Promise<Monster> {
    if (!creatorDiscordId) {
      throw new Error("Creator Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Monster name is required");
    }

    return repository.createMonster(input, creatorDiscordId);
  }

  async updateMonster(
    input: UpdateMonsterInput,
    userDiscordId: string
  ): Promise<Monster> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    if (!input.name?.trim()) {
      throw new Error("Monster name is required");
    }

    return repository.updateMonster(input, userDiscordId);
  }

  async deleteMonster(
    monsterId: string,
    userDiscordId: string
  ): Promise<boolean> {
    if (!userDiscordId) {
      throw new Error("User Discord ID is required");
    }

    return repository.deleteMonster(monsterId, userDiscordId);
  }

  async listAllSources(): Promise<Source[]> {
    return repository.listAllSources();
  }
}

export const monstersService = new MonstersService();

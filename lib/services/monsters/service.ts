import * as repository from "./repository";
import type {
  CreateMonsterInput,
  Monster,
  MonsterMini,
  SearchMonstersParams,
  UpdateMonsterInput,
} from "./types";

export class MonstersService {
  async getPublicMonster(id: string): Promise<Monster | null> {
    return repository.findPublicMonsterById(id);
  }

  async getMonster(monsterId: string): Promise<Monster | null> {
    return repository.findMonster(monsterId);
  }

  async searchMonsters(params: SearchMonstersParams): Promise<MonsterMini[]> {
    return repository.searchPublicMonsterMinis(params);
  }

  async listPublicMonsters(): Promise<MonsterMini[]> {
    return repository.listPublicMonsterMinis();
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

    const monster = await repository.updateMonster(input, userDiscordId);

    // invalidateEntityImageCache("monster", input.id);

    return monster;
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
}

export const monstersService = new MonstersService();

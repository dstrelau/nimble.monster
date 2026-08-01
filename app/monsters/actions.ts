"use server";

import { auth } from "@/lib/auth";
import {
  createHazard as createHazardService,
  deleteHazard as deleteHazardService,
  updateHazard as updateHazardService,
} from "@/lib/services/hazards";
import { listAllSources, monstersService } from "@/lib/services/monsters";
import type { PaginateMonstersParams } from "@/lib/services/monsters/service";
import type {
  CreateHazardInput,
  UpdateHazardInput,
  UpdateMonsterInput,
} from "@/lib/services/monsters/types";

export const listAllMonsterSources = async () => listAllSources();

export const paginatePublicMonsters = async (
  params: PaginateMonstersParams
) => {
  return monstersService.paginatePublicMonsters(params);
};

export async function updateMonster(input: UpdateMonsterInput) {
  const session = await auth();
  if (!session?.user?.discordId) {
    throw new Error("Unauthorized");
  }

  return monstersService.updateMonster(input, session.user.discordId);
}

export async function createHazard(input: CreateHazardInput) {
  const session = await auth();
  if (!session?.user?.discordId) throw new Error("Unauthorized");
  return createHazardService(input, session.user.discordId);
}

export async function updateHazard(input: UpdateHazardInput) {
  const session = await auth();
  if (!session?.user?.discordId) throw new Error("Unauthorized");
  return updateHazardService(input, session.user.discordId);
}

export async function deleteHazard(id: string) {
  const session = await auth();
  if (!session?.user?.discordId) throw new Error("Unauthorized");
  const deleted = await deleteHazardService(id, session.user.discordId);
  return {
    success: deleted,
    error: deleted ? null : "Could not delete the hazard. Please try again.",
  };
}

export const getPublicMonster = async (id: string) => {
  return monstersService.getPublicMonster(id);
};

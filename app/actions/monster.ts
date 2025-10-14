"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  type CreateMonsterInput,
  monstersService,
  type TypeFilter,
} from "@/lib/services/monsters";
import type { Ability, Action } from "@/lib/types";

export async function findPublicMonster(id: string) {
  const session = await auth();
  const monster = await monstersService.getMonsterInternal(id);
  if (!monster) {
    return { success: false, error: "Monster not found" };
  }
  const isOwner =
    session?.user?.discordId === monster.creator?.discordId || false;
  if (monster.visibility !== "public" && !isOwner) {
    return { success: false, error: "Monster not found" };
  }
  return { success: true, monster };
}

export async function searchPublicMonsters(params: {
  creatorId?: string;
  searchTerm?: string;
  type?: TypeFilter;
  sortBy?: "name" | "level" | "hp";
  sortDirection?: "asc" | "desc";
  limit?: number;
}) {
  try {
    const monsters = await monstersService.searchMonsters(params);
    return { success: true, monsters };
  } catch (_error) {
    return { success: false, error: "Failed to search monsters" };
  }
}

export async function createMonster(formData: {
  name: string;
  kind?: string;
  level: string;
  levelInt: number;
  hp: number;
  armor: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan" | string;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  teleport: number;
  burrow: number;
  familyId?: string | null;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  moreInfo?: string;
  visibility: "public" | "private";
  legendary?: boolean;
  bloodied?: string;
  lastStand?: string;
  saves?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const input: CreateMonsterInput = {
      ...formData,
      armor:
        formData.armor === "none"
          ? ""
          : (formData.armor as "" | "medium" | "heavy"),
      size: formData.size as
        | "tiny"
        | "small"
        | "medium"
        | "large"
        | "huge"
        | "gargantuan",
      families: formData.familyId ? [{ id: formData.familyId }] : undefined,
    };

    const monster = await monstersService.createMonster(
      input,
      session.user.discordId
    );

    revalidatePath("/my/monsters");

    return { success: true, monster };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteMonster(monsterId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await monstersService.deleteMonster(
    monsterId,
    session.user.discordId
  );

  if (deleted) {
    revalidatePath("/my/monsters");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the monster. Please try again.",
  };
}

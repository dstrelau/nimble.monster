"use server";

import { auth } from "@/lib/auth";
import { monstersService, type TypeFilter } from "@/lib/services/monsters";

export async function findPublicMonster(id: string) {
  const session = await auth();
  const monster = await monstersService.getMonster(id);
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

"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { findMonster } from "@/lib/db";
import type { Ability, Action } from "@/lib/types";

export async function findPublicMonster(id: string) {
  const [session, monster] = await Promise.all([auth(), findMonster(id)]);
  if (!monster) {
    return { success: false, error: "Monster not found" };
  }
  const isOwner = session?.user?.id === monster.creator?.discordId || false;
  if (monster.visibility !== "public" && !isOwner) {
    return notFound();
  }
  return { success: true, monster };
}

export type TypeFilter = "all" | "legendary" | "standard" | "minion";

export async function searchPublicMonsters(params: {
  creatorId?: string;
  searchTerm?: string;
  type?: TypeFilter;
  sortBy?: "name" | "level" | "hp";
  sortDirection?: "asc" | "desc";
  limit?: number;
}) {
  try {
    const monsters = await db.searchPublicMonsterMinis(params);
    return { success: true, monsters };
  } catch (error) {
    console.error("Error searching public monsters:", error);
    return { success: false, error: "Failed to search monsters" };
  }
}

export async function createMonster(formData: {
  name: string;
  kind?: string;
  level: string;
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

    const monster = await db.createMonster({
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
      discordId: session.user.id,
    });

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

  const deleted = await db.deleteMonster({
    id: monsterId,
    discordId: session.user.id,
  });

  if (deleted) {
    revalidatePath("/my/monsters");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the monster. Please try again.",
  };
}

"use server";

import * as db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Action, Ability } from "@/lib/types";

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
      armor: formData.armor as "" | "medium" | "heavy",
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

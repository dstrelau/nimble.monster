"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type { Ability, Action } from "@/lib/types";

export async function createCompanion(formData: {
  name: string;
  kind: string;
  class: string;
  hp_per_level: string;
  wounds: number;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan" | string;
  saves: string;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  dyingRule: string;
  moreInfo?: string;
  visibility: "public" | "private";
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const companion = await db.createCompanion({
      ...formData,
      size: formData.size as
        | "tiny"
        | "small"
        | "medium"
        | "large"
        | "huge"
        | "gargantuan",
      discordId: session.user.id,
    });

    revalidatePath("/my/companions");

    return { success: true, companion };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateCompanion(
  companionId: string,
  formData: {
    name: string;
    kind: string;
    class: string;
    hp_per_level: string;
    wounds: number;
    size:
      | "tiny"
      | "small"
      | "medium"
      | "large"
      | "huge"
      | "gargantuan"
      | string;
    saves: string;
    actions: Action[];
    abilities: Ability[];
    actionPreface: string;
    dyingRule: string;
    moreInfo?: string;
    visibility: "public" | "private";
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // First check if companion exists and user owns it
    const existingCompanion = await db.findCompanionWithCreatorDiscordId(
      companionId,
      session.user.id
    );

    if (!existingCompanion) {
      return { success: false, error: "Companion not found" };
    }

    const companion = await db.updateCompanion({
      id: companionId,
      name: formData.name,
      kind: formData.kind,
      class: formData.class,
      hp_per_level: formData.hp_per_level,
      wounds: formData.wounds,
      size: formData.size as
        | "tiny"
        | "small"
        | "medium"
        | "large"
        | "huge"
        | "gargantuan",
      saves: formData.saves,
      actions: formData.actions as unknown as Action[],
      abilities: formData.abilities as unknown as Ability[],
      actionPreface: formData.actionPreface,
      dyingRule: formData.dyingRule,
      moreInfo: formData.moreInfo || "",
      visibility: formData.visibility,
      discordId: session.user.id,
    });

    revalidatePath(`/c/${companionId}`);
    revalidatePath("/my/companions");

    return { success: true, companion };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function findPublicCompanion(companionId: string) {
  try {
    const companion = await db.findPublicCompanionById(companionId);
    if (!companion) {
      return { success: false, error: "Companion not found", companion: null };
    }

    return { success: true, error: null, companion };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      companion: null,
    };
  }
}

export async function deleteCompanion(companionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteCompanion({
    id: companionId,
    discordId: session.user.id,
  });

  if (deleted) {
    revalidatePath("/my/companions");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the companion. Please try again.",
  };
}

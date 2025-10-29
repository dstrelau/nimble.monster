"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type { ClassAbilityItem } from "@/lib/types";
import { getClassAbilityListUrl } from "@/lib/utils/url";

export async function getUserClassAbilityLists() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated", lists: [] };
    }

    const lists = await db.getUserClassAbilityLists(session.user.discordId);
    return { success: true, lists };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      lists: [],
    };
  }
}

export async function createClassAbilityList(formData: {
  name: string;
  description: string;
  characterClass?: string;
  items: Array<{ name: string; description: string }>;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const list = await db.createClassAbilityList({
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath("/my/class-options");

    return { success: true, list };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateClassAbilityList(
  listId: string,
  formData: {
    name: string;
    description: string;
    characterClass?: string;
    items: ClassAbilityItem[];
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const list = await db.updateClassAbilityList({
      id: listId,
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath(getClassAbilityListUrl(list));
    revalidatePath("/my/class-options");

    return { success: true, list };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function findClassAbilityList(listId: string) {
  try {
    const list = await db.findClassAbilityList(listId);
    if (!list) {
      return { success: false, error: "List not found", list: null };
    }

    return { success: true, error: null, list };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      list: null,
    };
  }
}

export async function deleteClassAbilityList(listId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteClassAbilityList({
    id: listId,
    discordId: session.user.discordId,
  });

  if (deleted) {
    revalidatePath("/my/class-options");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the list. Please try again.",
  };
}

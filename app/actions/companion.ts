"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

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
    discordId: session.user.discordId,
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

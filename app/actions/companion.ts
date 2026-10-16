"use server";

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

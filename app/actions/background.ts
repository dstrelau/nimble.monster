"use server";

import { findBackground } from "@/lib/services/backgrounds";

export async function findPublicBackground(backgroundId: string) {
  try {
    const background = await findBackground(backgroundId);
    if (!background) {
      return {
        success: false,
        error: "Background not found",
        background: null,
      };
    }

    return { success: true, error: null, background };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      background: null,
    };
  }
}

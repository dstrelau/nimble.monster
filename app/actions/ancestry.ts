"use server";

import { findAncestry } from "@/lib/services/ancestries";

export async function findPublicAncestry(ancestryId: string) {
  try {
    const ancestry = await findAncestry(ancestryId);
    if (!ancestry || ancestry.visibility !== "public") {
      return { success: false, error: "Ancestry not found", ancestry: null };
    }

    return { success: true, error: null, ancestry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      ancestry: null,
    };
  }
}

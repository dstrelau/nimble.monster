"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function getUserFamilies() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated", families: [] };
    }

    const families = await db.listFamiliesForUser(session.user.discordId);
    return { success: true, families, error: null };
  } catch (error) {
    console.error("Error fetching families:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      families: [],
    };
  }
}

export async function deleteFamily(familyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const deleted = await db.deleteFamily({
      id: familyId,
      discordId: session.user.discordId,
    });

    revalidatePath("/my/families");

    return {
      success: deleted,
      error: deleted ? null : "Failed to delete family",
    };
  } catch (error) {
    console.error("Error deleting family:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

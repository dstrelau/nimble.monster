"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function getUserSpellSchools() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated", spellSchools: [] };
    }

    const spellSchools = await db.listAllSpellSchoolsForDiscordID(
      session.user.discordId
    );
    return { success: true, spellSchools, error: null };
  } catch (error) {
    console.error("Error fetching spell schools:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      spellSchools: [],
    };
  }
}

export async function listPublicSpellSchoolsAction() {
  return db.listPublicSpellSchools();
}

export async function deleteSpellSchool(spellSchoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const deleted = await db.deleteSpellSchool({
      id: spellSchoolId,
      discordId: session.user.discordId,
    });

    // Revalidate the schools pages and school detail page to force a refresh
    revalidatePath("/my/spell-schools");
    revalidatePath(`/spell-schools/${spellSchoolId}`);
    revalidatePath("/spell-schools");

    return {
      success: deleted,
      error: deleted ? null : "Failed to delete spell school",
    };
  } catch (error) {
    console.error("Error deleting spell school:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

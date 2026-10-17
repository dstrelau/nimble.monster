"use server";

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

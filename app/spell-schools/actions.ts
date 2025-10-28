"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type { SpellSchoolVisibility, SpellTarget } from "@/lib/types";

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

export async function createSpellSchool(formData: {
  name: string;
  description?: string;
  spells: {
    name: string;
    tier: number;
    actions: number;
    reaction: boolean;
    target?: SpellTarget;
    damage?: string;
    description?: string;
    highLevels?: string;
    concentration?: string;
    upcast?: string;
  }[];
  visibility: SpellSchoolVisibility;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const spellSchool = await db.createSpellSchool({
      name: formData.name,
      description: formData.description,
      spells: formData.spells,
      visibility: formData.visibility,
      discordId: session.user.discordId,
    });

    // Revalidate the schools pages to force a refresh
    revalidatePath("/my/spell-schools");
    revalidatePath("/spell-schools");

    return { success: true, spellSchool };
  } catch (error) {
    console.error("Error creating spell school:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateSpellSchool(
  spellSchoolId: string,
  formData: {
    name: string;
    description?: string;
    spells: {
      name: string;
      tier: number;
      actions: number;
      reaction: boolean;
      target?: SpellTarget;
      damage?: string;
      description?: string;
      highLevels?: string;
      concentration?: string;
      upcast?: string;
    }[];
    visibility: SpellSchoolVisibility;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const spellSchool = await db.updateSpellSchool({
      id: spellSchoolId,
      name: formData.name,
      description: formData.description,
      spells: formData.spells,
      visibility: formData.visibility,
      discordId: session.user.discordId,
    });

    // Revalidate the schools pages and school detail page to force a refresh
    revalidatePath(`/u/${session.user.username}`);
    revalidatePath("/my/spell-schools");
    revalidatePath(`/spell-schools/${spellSchoolId}`);
    revalidatePath("/spell-schools");

    return { success: true, spellSchool };
  } catch (error) {
    console.error("Error updating spell school:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
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

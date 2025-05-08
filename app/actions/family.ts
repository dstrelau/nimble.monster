"use server";

import * as db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Ability } from "@/lib/types";

export async function deleteFamily(familyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const deleted = await db.deleteFamily({
      id: familyId,
      discordId: session.user.id,
    });

    // Revalidate the families page to force a refresh
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

export async function updateFamily(
  familyId: string,
  formData: {
    name: string;
    abilityName: string;
    abilityDescription: string;
  },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const ability: Ability = {
      name: formData.abilityName,
      description: formData.abilityDescription,
    };

    const family = await db.updateFamily({
      id: familyId,
      name: formData.name,
      abilities: [ability],
      discordId: session.user.id,
    });

    // Revalidate the families page to force a refresh
    revalidatePath("/my/families");

    return { success: true, family };
  } catch (error) {
    console.error("Error updating family:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getUserFamilies() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated", families: [] };
    }

    const families = await db.getUserFamilies(session.user.id);
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

export async function createFamily(formData: {
  name: string;
  abilityName: string;
  abilityDescription: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const ability: Ability = {
      name: formData.abilityName,
      description: formData.abilityDescription,
    };

    const family = await db.createFamily({
      name: formData.name,
      abilities: [ability],
      discordId: session.user.id,
    });

    // Revalidate the families page to force a refresh
    revalidatePath("/my/families");

    return { success: true, family };
  } catch (error) {
    console.error("Error creating family:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

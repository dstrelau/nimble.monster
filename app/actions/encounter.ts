"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import { encounters, monsters } from "@/lib/db/schema";
import type { CollectionVisibilityType } from "@/lib/types";

export async function deleteEncounter(encounterId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const deleted = await db.deleteEncounter({
      id: encounterId,
      discordId: session.user.discordId,
    });

    if (deleted) {
      revalidatePath("/my/encounters");
      return { success: true, error: null };
    }
    return {
      success: false,
      error: "Could not delete the encounter. Please try again.",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage.includes("foreign key constraint")) {
      return {
        success: false,
        error:
          "Cannot delete this encounter because it has monsters associated with it.",
      };
    }

    return {
      success: false,
      error:
        "An error occurred while deleting the encounter. Please try again later.",
    };
  }
}

export async function createEncounter(formData: {
  name: string;
  visibility: CollectionVisibilityType;
  description?: string;
  heroCount: number;
  heroLevel: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const encounter = await db.createEncounter({
      name: formData.name,
      visibility: formData.visibility,
      description: formData.description,
      heroCount: formData.heroCount,
      heroLevel: formData.heroLevel,
      discordId: session.user.discordId,
    });

    revalidatePath("/my/encounters");

    return { success: true, encounter };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateEncounter(
  encounterId: string,
  formData: {
    name: string;
    visibility: CollectionVisibilityType;
    description?: string;
    heroCount: number;
    heroLevel: number;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const encounter = await db.updateEncounter({
      id: encounterId,
      name: formData.name,
      visibility: formData.visibility,
      description: formData.description,
      heroCount: formData.heroCount,
      heroLevel: formData.heroLevel,
      discordId: session.user.discordId,
    });

    if (!encounter) {
      return {
        success: false,
        error: "Encounter not found or you don't have permission to update it",
      };
    }

    revalidatePath("/my/encounters");

    return { success: true, encounter };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function listOwnEncounters() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const encounters = await db.listEncountersWithMonstersForUser(
    session.user.discordId
  );
  return { success: true, encounters };
}

export async function addMonsterToEncounter(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const monsterId = formData.get("monsterId")?.toString();
  const encounterId = formData.get("encounterId")?.toString();
  if (!monsterId || !encounterId) {
    return { success: false, error: "Missing monsterId or encounterId" };
  }

  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const isPerHero = formData.get("isPerHero") === "true";

  const entityDb = getDatabase();

  const ownedEncounter = await entityDb
    .select({ id: encounters.id })
    .from(encounters)
    .where(
      and(
        eq(encounters.id, encounterId),
        eq(encounters.creatorId, session.user.id)
      )
    )
    .limit(1);
  if (ownedEncounter.length === 0) {
    return {
      success: false,
      error: "Encounter not found or you don't have permission to update it",
    };
  }

  const accessible = await entityDb
    .select({ id: monsters.id })
    .from(monsters)
    .where(
      and(
        eq(monsters.id, monsterId),
        or(
          eq(monsters.visibility, "public"),
          eq(monsters.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addMonsterToEncounter({
    monsterId,
    encounterId,
    quantity,
    isPerHero,
  });
  return { success: true };
}

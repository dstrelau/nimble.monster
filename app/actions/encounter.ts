"use server";

import { and, eq, or } from "drizzle-orm";
import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import { encounters, monsters } from "@/lib/db/schema";
import {
  PUBLIC_ENCOUNTER_CONTENT_ERROR,
  UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
} from "@/lib/encounter-privacy";

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

  const requestedQuantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const requestedPerHero = formData.get("isPerHero") === "true";
  const heroesPerMonster = Math.max(
    1,
    Number(formData.get("heroesPerMonster")) || 1
  );

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
    .select({ id: monsters.id, legendary: monsters.legendary })
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
  const quantity = accessible[0].legendary ? 1 : requestedQuantity;
  const isPerHero = !accessible[0].legendary && requestedPerHero;

  try {
    await db.addMonsterToEncounter({
      monsterId,
      encounterId,
      quantity,
      isPerHero,
      heroesPerMonster,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        PUBLIC_ENCOUNTER_CONTENT_ERROR,
        UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
      ].includes(error.message)
    ) {
      return { success: false, error: error.message };
    }
    throw error;
  }
  return { success: true };
}

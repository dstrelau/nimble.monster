"use server";
import { auth } from "@/lib/auth";
import {
  createCondition as dbCreateCondition,
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db/condition";
import type { Condition } from "@/lib/types";

export async function loadOwnConditions(): Promise<Condition[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return await listConditionsForDiscordId(session.user.id);
}

export async function loadConditionsForDiscordId(
  discordId: string
): Promise<Condition[]> {
  return await listConditionsForDiscordId(discordId);
}

export async function loadOfficialConditions(): Promise<Condition[]> {
  return await listOfficialConditions();
}

export async function createCondition(
  name: string,
  description: string
): Promise<Condition> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  return await dbCreateCondition(session.user.id, name, description);
}

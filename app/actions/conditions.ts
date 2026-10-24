"use server";
import {
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db/condition";
import type { Condition } from "@/lib/types";

export async function loadConditionsForDiscordId(
  discordId: string
): Promise<Condition[]> {
  return await listConditionsForDiscordId(discordId);
}

export async function loadOfficialConditions(): Promise<Condition[]> {
  return await listOfficialConditions();
}

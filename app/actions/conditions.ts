"use server";
import { auth } from "@/lib/auth";
import {
  createCondition as dbCreateCondition,
  listConditionsForDiscordId,
  listConditionsForMonster,
  listOfficialConditions,
} from "@/lib/db/condition";
import type { Condition, MonsterCondition } from "@/lib/types";

export async function loadMonsterConditions(
  monsterId: string
): Promise<MonsterCondition[]> {
  return (await listConditionsForMonster(monsterId)).map((mc) => ({
    ...mc.condition,
    inline: mc.inline,
  }));
}

export async function loadOwnConditions(): Promise<Condition[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return await listConditionsForDiscordId(session.user.id);
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

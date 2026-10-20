"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createCondition as dbCreateCondition,
  deleteCondition as dbDeleteCondition,
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

export async function createCondition(
  name: string,
  description: string
): Promise<Condition> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const validName = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[^[\]|\r\n]+$/)
    .parse(name);
  const validDescription = z.string().trim().min(1).parse(description);
  const existing = await listConditionsForDiscordId(session.user.discordId);
  if (
    existing.some(
      (condition) => condition.name.toLowerCase() === validName.toLowerCase()
    )
  ) {
    throw new Error("A condition with this name already exists");
  }
  const condition = await dbCreateCondition(
    session.user.discordId,
    validName,
    validDescription
  );
  revalidatePath("/my", "layout");
  return condition;
}

export async function deleteCondition(conditionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await dbDeleteCondition(conditionId, session.user.discordId);
  revalidatePath("/my", "layout");
}

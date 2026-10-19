import { and, eq, sql } from "drizzle-orm";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { getDatabase } from "./drizzle";
import { conditions, monstersConditions, users } from "./schema";

export async function upsertOfficialCondition(input: {
  name: string;
  description: string;
}) {
  const db = getDatabase();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: conditions.id })
      .from(conditions)
      .where(
        and(
          eq(conditions.official, true),
          sql`lower(${conditions.name}) = lower(${input.name})`
        )
      )
      .limit(1);
    if (existing) {
      const [updated] = await tx
        .update(conditions)
        .set(input)
        .where(eq(conditions.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await tx
      .insert(conditions)
      .values({ ...input, official: true, creatorId: OFFICIAL_USER_ID })
      .returning();
    return created;
  });
}

export async function listOfficialConditions() {
  const db = getDatabase();
  return await db
    .select()
    .from(conditions)
    .where(eq(conditions.official, true));
}

export async function listConditionsForMonster(monsterId: string) {
  const db = getDatabase();
  return await db
    .select({
      monsterId: monstersConditions.monsterId,
      conditionId: monstersConditions.conditionId,
      inline: monstersConditions.inline,
      condition: conditions,
    })
    .from(monstersConditions)
    .innerJoin(conditions, eq(monstersConditions.conditionId, conditions.id))
    .where(eq(monstersConditions.monsterId, monsterId));
}

export async function listConditionsForDiscordId(discordId: string) {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];

  return await db
    .select()
    .from(conditions)
    .where(eq(conditions.creatorId, userResult[0].id));
}

export async function createCondition(
  discordId: string,
  name: string,
  description: string
) {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const result = await db
    .insert(conditions)
    .values({
      name,
      description,
      creatorId: userResult[0].id,
    })
    .returning();

  return result[0];
}

export async function deleteCondition(conditionId: string, discordId: string) {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;

  const result = await db
    .delete(conditions)
    .where(
      and(
        eq(conditions.id, conditionId),
        eq(conditions.creatorId, userResult[0].id)
      )
    )
    .returning();

  return result[0] ?? null;
}

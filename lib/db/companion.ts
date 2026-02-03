import { and, asc, eq } from "drizzle-orm";
import type { MonsterSize } from "@/lib/services/monsters";
import type { Ability, Action, Companion } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toCompanion } from "./converters";
import { getDatabase } from "./drizzle";
import { awards, companions, companionsAwards, sources, users } from "./schema";

const stripActionIds = (actions: Action[]): Omit<Action, "id">[] =>
  actions.map(({ id: _id, ...action }) => action);

async function loadCompanionWithRelations(companionId: string) {
  const db = getDatabase();

  const companionRows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(eq(companions.id, companionId))
    .limit(1);

  if (companionRows.length === 0) return null;

  const row = companionRows[0];

  const awardRows = await db
    .select({ award: awards })
    .from(companionsAwards)
    .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
    .where(eq(companionsAwards.companionId, companionId));

  return {
    ...row.companions,
    creator: row.users,
    source: row.sources,
    companionAwards: awardRows.map((r) => ({ award: r.award })),
  };
}

export const deleteCompanion = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(companions)
    .where(and(eq(companions.id, id), eq(companions.userId, userResult[0].id)));

  return result.rowsAffected > 0;
};

export const listPublicCompanions = async (): Promise<Companion[]> => {
  const db = getDatabase();

  const rows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(eq(companions.visibility, "public"))
    .orderBy(asc(companions.name));

  const results: Companion[] = [];
  for (const row of rows) {
    const awardRows = await db
      .select({ award: awards })
      .from(companionsAwards)
      .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
      .where(eq(companionsAwards.companionId, row.companions.id));

    results.push(
      toCompanion({
        ...row.companions,
        creator: row.users,
        source: row.sources,
        companionAwards: awardRows.map((r) => ({ award: r.award })),
      })
    );
  }

  return results;
};

export const findCompanion = async (id: string): Promise<Companion | null> => {
  const data = await loadCompanionWithRelations(id);
  return data ? toCompanion(data) : null;
};

export const findPublicCompanionById = async (
  id: string
): Promise<Companion | null> => {
  const db = getDatabase();

  const check = await db
    .select({ id: companions.id })
    .from(companions)
    .where(and(eq(companions.id, id), eq(companions.visibility, "public")))
    .limit(1);

  if (check.length === 0) return null;

  const data = await loadCompanionWithRelations(id);
  return data ? toCompanion(data) : null;
};

export const findCompanionWithCreator = async (
  id: string,
  creatorId: string
): Promise<Companion | null> => {
  const db = getDatabase();

  const check = await db
    .select({ id: companions.id })
    .from(companions)
    .where(and(eq(companions.id, id), eq(companions.userId, creatorId)))
    .limit(1);

  if (check.length === 0) return null;

  const data = await loadCompanionWithRelations(id);
  return data ? toCompanion(data) : null;
};

export const listPublicCompanionsForUser = async (
  userId: string
): Promise<Companion[]> => {
  const db = getDatabase();

  const rows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(
      and(eq(companions.userId, userId), eq(companions.visibility, "public"))
    )
    .orderBy(asc(companions.name));

  const results: Companion[] = [];
  for (const row of rows) {
    const awardRows = await db
      .select({ award: awards })
      .from(companionsAwards)
      .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
      .where(eq(companionsAwards.companionId, row.companions.id));

    results.push(
      toCompanion({
        ...row.companions,
        creator: row.users,
        source: row.sources,
        companionAwards: awardRows.map((r) => ({ award: r.award })),
      })
    );
  }

  return results;
};

export const listAllCompanionsForDiscordID = async (
  discordId: string
): Promise<Companion[]> => {
  const db = getDatabase();

  const rows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(eq(users.discordId, discordId))
    .orderBy(asc(companions.name));

  const results: Companion[] = [];
  for (const row of rows) {
    const awardRows = await db
      .select({ award: awards })
      .from(companionsAwards)
      .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
      .where(eq(companionsAwards.companionId, row.companions.id));

    results.push(
      toCompanion({
        ...row.companions,
        creator: row.users,
        source: row.sources,
        companionAwards: awardRows.map((r) => ({ award: r.award })),
      })
    );
  }

  return results;
};

export interface CreateCompanionInput {
  name: string;
  kind: string;
  class: string;
  hp_per_level: string;
  wounds: number;
  size: MonsterSize;
  saves: string;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  dyingRule: string;
  moreInfo?: string;
  visibility: "public" | "private";
  discordId: string;
}

export const createCompanion = async (
  input: CreateCompanionInput
): Promise<Companion> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const result = await db
    .insert(companions)
    .values({
      name: input.name,
      kind: input.kind,
      class: input.class,
      hpPerLevel: input.hp_per_level,
      wounds: input.wounds,
      size: input.size,
      saves: input.saves,
      actions: stripActionIds(input.actions),
      abilities: input.abilities,
      actionPreface: input.actionPreface,
      dyingRule: input.dyingRule,
      moreInfo: input.moreInfo || "",
      visibility: input.visibility,
      userId: userResult[0].id,
    })
    .returning();

  const data = await loadCompanionWithRelations(result[0].id);
  if (!data) throw new Error("Failed to create companion");

  return toCompanion(data);
};

export interface UpdateCompanionInput {
  id: string;
  name: string;
  kind: string;
  class: string;
  hp_per_level: string;
  wounds: number;
  size: MonsterSize;
  saves: string;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  dyingRule: string;
  moreInfo: string;
  visibility: "public" | "private";
  discordId: string;
}

export const updateCompanion = async (
  input: UpdateCompanionInput
): Promise<Companion> => {
  if (!isValidUUID(input.id)) {
    throw new Error("Invalid companion ID");
  }

  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  await db
    .update(companions)
    .set({
      name: input.name,
      kind: input.kind,
      class: input.class,
      hpPerLevel: input.hp_per_level,
      wounds: input.wounds,
      size: input.size,
      saves: input.saves,
      actions: stripActionIds(input.actions),
      abilities: input.abilities,
      actionPreface: input.actionPreface,
      dyingRule: input.dyingRule,
      moreInfo: input.moreInfo,
      visibility: input.visibility,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(companions.id, input.id), eq(companions.userId, userResult[0].id))
    );

  const data = await loadCompanionWithRelations(input.id);
  if (!data) throw new Error("Failed to update companion");

  return toCompanion(data);
};

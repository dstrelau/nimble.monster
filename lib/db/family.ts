import { and, asc, count, eq } from "drizzle-orm";
import type { Ability, Family, FamilyOverview } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type FamilyRow,
  families,
  monsters,
  monstersFamilies,
  users,
} from "./schema";

const toFamilyOverviewFromRow = (
  family: FamilyRow & { creator: typeof users.$inferSelect },
  monsterCount: number
): FamilyOverview => ({
  id: family.id,
  name: family.name,
  description: family.description ?? undefined,
  abilities: ((family.abilities as Omit<Ability, "id">[]) || []).map(
    (ability) => ({
      ...ability,
      id: crypto.randomUUID(),
    })
  ),
  visibility: family.visibility as FamilyOverview["visibility"],
  monsterCount,
  creatorId: family.creator.discordId ?? "",
  creator: toUser(family.creator),
});

export const listFamiliesForUser = async (
  discordId: string
): Promise<FamilyOverview[]> => {
  const db = getDatabase();

  const results = await db
    .select({
      family: families,
      creator: users,
      monsterCount: count(monstersFamilies.monsterId),
    })
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .leftJoin(monstersFamilies, eq(families.id, monstersFamilies.familyId))
    .where(eq(users.discordId, discordId))
    .groupBy(families.id)
    .orderBy(asc(families.name));

  return results.map((r) =>
    toFamilyOverviewFromRow({ ...r.family, creator: r.creator }, r.monsterCount)
  );
};

export const getUserFamiliesWithMonsters = async (
  _discordId: string
): Promise<Family[]> => {
  return [];
};

export const listPublicFamiliesHavingMonstersForUser = async (
  _creatorId: string
): Promise<Family[]> => {
  return [];
};

export const getUserPublicFamiliesCount = async (
  username: string
): Promise<number> => {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userResult.length === 0) return 0;

  const result = await db
    .select({ count: count() })
    .from(families)
    .where(
      and(
        eq(families.creatorId, userResult[0].id),
        eq(families.visibility, "public")
      )
    );

  return result[0]?.count || 0;
};

export const getFamily = async (id: string): Promise<FamilyOverview | null> => {
  const db = getDatabase();

  const results = await db
    .select({
      family: families,
      creator: users,
      monsterCount: count(monstersFamilies.monsterId),
    })
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .leftJoin(monstersFamilies, eq(families.id, monstersFamilies.familyId))
    .where(eq(families.id, id))
    .groupBy(families.id)
    .limit(1);

  if (results.length === 0) return null;
  const r = results[0];

  return toFamilyOverviewFromRow(
    { ...r.family, creator: r.creator },
    r.monsterCount
  );
};

export interface CreateFamilyInput {
  name: string;
  description?: string;
  abilities: Ability[];
  discordId: string;
}

export const createFamily = async ({
  name,
  description,
  abilities,
  discordId,
}: CreateFamilyInput): Promise<FamilyOverview> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const creator = userResult[0];

  const result = await db
    .insert(families)
    .values({
      name,
      description: description || null,
      abilities: JSON.stringify(abilities.map((a) => ({ ...a }))),
      visibility: "public",
      creatorId: creator.id,
    })
    .returning();

  const family = result[0];

  return toFamilyOverviewFromRow({ ...family, creator }, 0);
};

export const updateFamily = async ({
  id,
  name,
  description,
  abilities,
  discordId,
}: {
  id: string;
  name: string;
  description?: string;
  abilities: Ability[];
  discordId: string;
}): Promise<FamilyOverview> => {
  if (!isValidUUID(id)) {
    throw new Error("family not found");
  }

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const creator = userResult[0];

  const result = await db
    .update(families)
    .set({
      name,
      description: description === "" ? null : description,
      abilities: JSON.stringify(
        abilities.map((a) => ({
          ...a,
          Name: undefined,
          Description: undefined,
        }))
      ),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(families.id, id), eq(families.creatorId, creator.id)))
    .returning();

  if (result.length === 0) {
    throw new Error("family not found");
  }

  const family = result[0];

  const countResult = await db
    .select({ count: count() })
    .from(monstersFamilies)
    .where(eq(monstersFamilies.familyId, family.id));

  return toFamilyOverviewFromRow(
    { ...family, creator },
    countResult[0]?.count || 0
  );
};

export const deleteFamily = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) {
    return false;
  }

  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(families)
    .where(and(eq(families.id, id), eq(families.creatorId, userResult[0].id)));

  return result.rowsAffected > 0;
};

export const getRandomFeaturedFamily = async (): Promise<Family | null> => {
  const db = getDatabase();

  const featuredFamilies = await db
    .select()
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .where(eq(families.featured, true));

  if (featuredFamilies.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * featuredFamilies.length);
  const { families: family, users: creator } = featuredFamilies[randomIndex];

  const monsterRows = await db
    .select({ id: monsters.id })
    .from(monsters)
    .innerJoin(monstersFamilies, eq(monsters.id, monstersFamilies.monsterId))
    .where(
      and(
        eq(monstersFamilies.familyId, family.id),
        eq(monsters.visibility, "public")
      )
    );

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: ((family.abilities as Omit<Ability, "id">[]) || []).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: family.visibility as Family["visibility"],
    monsters: [],
    monsterCount: monsterRows.length,
    creatorId: creator.discordId ?? "",
    creator: toUser(creator),
  };
};

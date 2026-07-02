import { and, asc, eq, inArray, or } from "drizzle-orm";
import { toUser } from "@/lib/db/converters";
import { findMonstersByIds } from "@/lib/services/monsters";
import { toMonsterMini } from "@/lib/services/monsters/converters";
import type {
  Encounter,
  EncounterMonsterEntry,
  EncounterMonsterEntryFull,
  EncounterOverview,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type EncounterRow,
  encounters,
  monsters,
  monstersEncounters,
  type UserRow,
  users,
} from "./schema";

async function loadEncounterOverview(
  db: ReturnType<typeof getDatabase>,
  encounter: EncounterRow,
  creator: UserRow
): Promise<EncounterOverview> {
  const monsterLinks = await db
    .select({
      monster: monsters,
      quantity: monstersEncounters.quantity,
      isPerHero: monstersEncounters.isPerHero,
    })
    .from(monstersEncounters)
    .innerJoin(monsters, eq(monstersEncounters.monsterId, monsters.id))
    .where(eq(monstersEncounters.encounterId, encounter.id));

  const entries: EncounterMonsterEntry[] = monsterLinks.map((link) => ({
    monster: toMonsterMini(link.monster),
    quantity: link.quantity,
    isPerHero: link.isPerHero,
  }));

  return {
    id: encounter.id,
    name: encounter.name,
    description: encounter.description || undefined,
    visibility: (encounter.visibility ?? "public") as "public" | "private",
    heroCount: encounter.heroCount,
    heroLevel: encounter.heroLevel,
    creator: toUser(creator),
    monsters: entries,
    createdAt: encounter.createdAt ? new Date(encounter.createdAt) : undefined,
  };
}

async function loadEncounterFull(
  db: ReturnType<typeof getDatabase>,
  encounter: EncounterRow,
  creator: UserRow
): Promise<Encounter> {
  const monsterLinks = await db
    .select({
      monsterId: monstersEncounters.monsterId,
      quantity: monstersEncounters.quantity,
      isPerHero: monstersEncounters.isPerHero,
    })
    .from(monstersEncounters)
    .where(eq(monstersEncounters.encounterId, encounter.id));

  const fullMonsters = await findMonstersByIds(
    monsterLinks.map((link) => link.monsterId)
  );
  const monstersById = new Map(fullMonsters.map((m) => [m.id, m]));

  const entries: EncounterMonsterEntryFull[] = monsterLinks
    .map((link) => {
      const monster = monstersById.get(link.monsterId);
      return monster
        ? { monster, quantity: link.quantity, isPerHero: link.isPerHero }
        : null;
    })
    .filter((entry): entry is EncounterMonsterEntryFull => entry !== null);

  return {
    id: encounter.id,
    name: encounter.name,
    description: encounter.description || undefined,
    visibility: (encounter.visibility ?? "public") as "public" | "private",
    heroCount: encounter.heroCount,
    heroLevel: encounter.heroLevel,
    creator: toUser(creator),
    monsters: entries,
    createdAt: encounter.createdAt ? new Date(encounter.createdAt) : undefined,
  };
}

export const listEncountersWithMonstersForUser = async (
  discordId: string
): Promise<EncounterOverview[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  const encounterRows = await db
    .select()
    .from(encounters)
    .where(eq(encounters.creatorId, user.id))
    .orderBy(asc(encounters.name));

  if (encounterRows.length === 0) return [];

  const monsterLinks = await db
    .select({
      encounterId: monstersEncounters.encounterId,
      monster: monsters,
      quantity: monstersEncounters.quantity,
      isPerHero: monstersEncounters.isPerHero,
    })
    .from(monstersEncounters)
    .innerJoin(monsters, eq(monstersEncounters.monsterId, monsters.id))
    .where(
      inArray(
        monstersEncounters.encounterId,
        encounterRows.map((e) => e.id)
      )
    );

  const entriesByEncounter = new Map<string, EncounterMonsterEntry[]>();
  for (const link of monsterLinks) {
    const existing = entriesByEncounter.get(link.encounterId) ?? [];
    existing.push({
      monster: toMonsterMini(link.monster),
      quantity: link.quantity,
      isPerHero: link.isPerHero,
    });
    entriesByEncounter.set(link.encounterId, existing);
  }

  return encounterRows.map((encounter) => ({
    id: encounter.id,
    name: encounter.name,
    description: encounter.description || undefined,
    visibility: (encounter.visibility ?? "public") as "public" | "private",
    heroCount: encounter.heroCount,
    heroLevel: encounter.heroLevel,
    creator: toUser(user),
    monsters: entriesByEncounter.get(encounter.id) ?? [],
    createdAt: encounter.createdAt ? new Date(encounter.createdAt) : undefined,
  }));
};

export const getPublicEncounterById = async (
  id: string
): Promise<Encounter | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const encounterResult = await db
    .select({ encounter: encounters, creator: users })
    .from(encounters)
    .innerJoin(users, eq(encounters.creatorId, users.id))
    .where(and(eq(encounters.id, id), eq(encounters.visibility, "public")))
    .limit(1);

  if (encounterResult.length === 0) return null;

  return loadEncounterFull(
    db,
    encounterResult[0].encounter,
    encounterResult[0].creator
  );
};

export const getEncounter = async (
  id: string,
  discordId?: string
): Promise<Encounter | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  if (discordId) {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);

    if (userResult.length > 0) {
      const ownedEncounter = await db
        .select({ encounter: encounters, creator: users })
        .from(encounters)
        .innerJoin(users, eq(encounters.creatorId, users.id))
        .where(
          and(eq(encounters.id, id), eq(encounters.creatorId, userResult[0].id))
        )
        .limit(1);

      if (ownedEncounter.length > 0) {
        return loadEncounterFull(
          db,
          ownedEncounter[0].encounter,
          ownedEncounter[0].creator
        );
      }
    }
  }

  return getPublicEncounterById(id);
};

export interface CreateEncounterInput {
  discordId: string;
  name: string;
  description?: string;
  visibility: "public" | "private";
  heroCount: number;
  heroLevel: number;
  monsters?: Array<{ monsterId: string; quantity: number; isPerHero: boolean }>;
}

export interface UpdateEncounterInput extends CreateEncounterInput {
  id: string;
}

export const createEncounter = async (
  input: CreateEncounterInput
): Promise<EncounterOverview> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  const encounterId = crypto.randomUUID();

  await db.insert(encounters).values({
    id: encounterId,
    name: input.name,
    description: input.description || undefined,
    visibility: input.visibility,
    heroCount: input.heroCount,
    heroLevel: input.heroLevel,
    creatorId: user.id,
  });

  if (input.monsters && input.monsters.length > 0) {
    await db.insert(monstersEncounters).values(
      input.monsters.map((m) => ({
        encounterId,
        monsterId: m.monsterId,
        quantity: m.quantity,
        isPerHero: m.isPerHero,
      }))
    );
  }

  const encounterResult = await db
    .select()
    .from(encounters)
    .where(eq(encounters.id, encounterId))
    .limit(1);

  return loadEncounterOverview(db, encounterResult[0], user);
};

export const updateEncounter = async (
  input: UpdateEncounterInput
): Promise<EncounterOverview> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  const existingEncounter = await db
    .select()
    .from(encounters)
    .where(and(eq(encounters.id, input.id), eq(encounters.creatorId, user.id)))
    .limit(1);

  if (existingEncounter.length === 0) {
    throw new Error("Encounter not found");
  }

  await db
    .update(encounters)
    .set({
      name: input.name,
      description: input.description || undefined,
      visibility: input.visibility,
      heroCount: input.heroCount,
      heroLevel: input.heroLevel,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(encounters.id, input.id));

  if (input.monsters) {
    await db
      .delete(monstersEncounters)
      .where(eq(monstersEncounters.encounterId, input.id));

    if (input.monsters.length > 0) {
      const qtyMap = new Map(input.monsters.map((m) => [m.monsterId, m]));
      const accessible = await db
        .select({ id: monsters.id })
        .from(monsters)
        .where(
          and(
            inArray(monsters.id, [...qtyMap.keys()]),
            or(eq(monsters.visibility, "public"), eq(monsters.userId, user.id))
          )
        );

      if (accessible.length > 0) {
        await db.insert(monstersEncounters).values(
          accessible.map((m) => {
            const entry = qtyMap.get(m.id);
            return {
              encounterId: input.id,
              monsterId: m.id,
              quantity: entry?.quantity ?? 1,
              isPerHero: entry?.isPerHero ?? false,
            };
          })
        );
      }
    }
  }

  const encounterResult = await db
    .select()
    .from(encounters)
    .where(eq(encounters.id, input.id))
    .limit(1);

  return loadEncounterOverview(db, encounterResult[0], user);
};

export const deleteEncounter = async (input: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(input.id)) return false;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(encounters)
    .where(
      and(
        eq(encounters.id, input.id),
        eq(encounters.creatorId, userResult[0].id)
      )
    );

  return result.rowsAffected > 0;
};

export const deleteMonsterFromEncounter = async (
  encounterId: string,
  monsterId: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(encounterId) || !isValidUUID(monsterId)) return false;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const encounterCheck = await db
    .select({ id: encounters.id })
    .from(encounters)
    .where(
      and(
        eq(encounters.id, encounterId),
        eq(encounters.creatorId, userResult[0].id)
      )
    )
    .limit(1);

  if (encounterCheck.length === 0) return false;

  const result = await db
    .delete(monstersEncounters)
    .where(
      and(
        eq(monstersEncounters.encounterId, encounterId),
        eq(monstersEncounters.monsterId, monsterId)
      )
    );

  return result.rowsAffected > 0;
};

export const addMonsterToEncounter = async (input: {
  monsterId: string;
  encounterId: string;
  quantity: number;
  isPerHero: boolean;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(monstersEncounters)
    .where(
      and(
        eq(monstersEncounters.encounterId, input.encounterId),
        eq(monstersEncounters.monsterId, input.monsterId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(monstersEncounters).values({
      encounterId: input.encounterId,
      monsterId: input.monsterId,
      quantity: input.quantity,
      isPerHero: input.isPerHero,
    });
  } else {
    await db
      .update(monstersEncounters)
      .set({ quantity: input.quantity, isPerHero: input.isPerHero })
      .where(
        and(
          eq(monstersEncounters.encounterId, input.encounterId),
          eq(monstersEncounters.monsterId, input.monsterId)
        )
      );
  }
};

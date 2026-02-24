import { trace } from "@opentelemetry/api";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  classAbilities,
  classAbilityItems,
  classAbilityLists,
  classes,
  classesClassAbilityLists,
} from "@/lib/db/schema";
import {
  OFFICIAL_CREATOR,
  OFFICIAL_USER_ID,
} from "@/lib/services/classes/official";
import type { Class } from "@/lib/types";

export const upsertOfficialClass = async (input: {
  id?: string;
  name: string;
  description: string;
  keyStats: string[];
  hitDie: string;
  startingHp: number;
  saves: Record<string, number>;
  armor: string[];
  weapons: object;
  startingGear: string[];
  levels: Array<{
    level: number;
    abilities: Array<{ name: string; description: string }>;
  }>;
  abilityLists: Array<{
    id?: string;
    name: string;
    description: string;
    items: Array<{ name: string; description: string }>;
  }>;
  sourceId?: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select({ id: classes.id })
    .from(classes)
    .where(
      and(eq(classes.name, input.name), eq(classes.userId, OFFICIAL_USER_ID))
    )
    .limit(1);

  const classId =
    existing.length > 0 ? existing[0].id : (input.id ?? crypto.randomUUID());

  const abilityInserts: {
    id: string;
    classId: string;
    level: number;
    name: string;
    description: string;
    orderIndex: number;
  }[] = [];

  for (const level of input.levels) {
    level.abilities.forEach((ability, index) => {
      abilityInserts.push({
        id: crypto.randomUUID(),
        classId,
        level: level.level,
        name: ability.name,
        description: ability.description,
        orderIndex: index,
      });
    });
  }

  try {
    await db.transaction(async (tx) => {
      if (existing.length > 0) {
        await tx
          .update(classes)
          .set({
            description: input.description,
            keyStats: input.keyStats,
            hitDie: input.hitDie,
            startingHp: input.startingHp,
            saves: input.saves,
            armor: input.armor,
            weapons: input.weapons,
            startingGear: input.startingGear,
            sourceId: input.sourceId || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(classes.id, classId));
      } else {
        await tx.insert(classes).values({
          id: classId,
          name: input.name,
          description: input.description,
          keyStats: input.keyStats,
          hitDie: input.hitDie,
          startingHp: input.startingHp,
          saves: input.saves,
          armor: input.armor,
          weapons: input.weapons,
          startingGear: input.startingGear,
          visibility: "public",
          userId: OFFICIAL_USER_ID,
          sourceId: input.sourceId || null,
          createdAt: "2024-01-01 00:00:00",
        });
      }

      // Delete existing class abilities and re-insert
      await tx
        .delete(classAbilities)
        .where(eq(classAbilities.classId, classId));

      if (abilityInserts.length > 0) {
        await tx.insert(classAbilities).values(abilityInserts);
      }

      // Get existing ability list links for this class
      const existingLinks = await tx
        .select({ abilityListId: classesClassAbilityLists.abilityListId })
        .from(classesClassAbilityLists)
        .where(eq(classesClassAbilityLists.classId, classId));

      const existingListIds = existingLinks.map((l) => l.abilityListId);

      // Delete existing links
      await tx
        .delete(classesClassAbilityLists)
        .where(eq(classesClassAbilityLists.classId, classId));

      // Delete orphaned ability lists owned by OFFICIAL_USER_ID
      if (existingListIds.length > 0) {
        await tx
          .delete(classAbilityLists)
          .where(
            and(
              inArray(classAbilityLists.id, existingListIds),
              eq(classAbilityLists.userId, OFFICIAL_USER_ID)
            )
          );
      }

      // Create new ability lists
      for (const [listIndex, abilityList] of input.abilityLists.entries()) {
        const listId = abilityList.id ?? crypto.randomUUID();

        await tx.insert(classAbilityLists).values({
          id: listId,
          name: abilityList.name,
          description: abilityList.description,
          characterClass: input.name,
          userId: OFFICIAL_USER_ID,
          sourceId: input.sourceId || null,
        });

        if (abilityList.items.length > 0) {
          await tx.insert(classAbilityItems).values(
            abilityList.items.map((item, itemIndex) => ({
              id: crypto.randomUUID(),
              classAbilityListId: listId,
              name: item.name,
              description: item.description,
              orderIndex: itemIndex,
            }))
          );
        }

        await tx.insert(classesClassAbilityLists).values({
          classId,
          abilityListId: listId,
          orderIndex: listIndex,
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.cause instanceof Error) {
      trace
        .getActiveSpan()
        ?.setAttribute("exception.cause", error.cause.message);
    }
    throw error;
  }
};

export const findOfficialClassesByNames = async (
  names: string[]
): Promise<Map<string, Class>> => {
  if (names.length === 0) return new Map();

  const db = getDatabase();
  const result = new Map<string, Class>();

  const rows = await db
    .select()
    .from(classes)
    .where(
      and(inArray(classes.name, names), eq(classes.userId, OFFICIAL_USER_ID))
    );

  if (rows.length === 0) return result;

  const classIds = rows.map((r) => r.id);

  // Load class abilities
  const allAbilities = await db
    .select()
    .from(classAbilities)
    .where(inArray(classAbilities.classId, classIds))
    .orderBy(asc(classAbilities.level), asc(classAbilities.orderIndex));

  const abilitiesByClass = new Map<string, typeof allAbilities>();
  for (const ability of allAbilities) {
    const existing = abilitiesByClass.get(ability.classId) || [];
    existing.push(ability);
    abilitiesByClass.set(ability.classId, existing);
  }

  // Load ability list links
  const allLinks = await db
    .select()
    .from(classesClassAbilityLists)
    .where(inArray(classesClassAbilityLists.classId, classIds));

  const linksByClass = new Map<string, typeof allLinks>();
  for (const link of allLinks) {
    const existing = linksByClass.get(link.classId) || [];
    existing.push(link);
    linksByClass.set(link.classId, existing);
  }

  // Load all referenced ability lists
  const allListIds = allLinks.map((l) => l.abilityListId);
  const allLists =
    allListIds.length > 0
      ? await db
          .select()
          .from(classAbilityLists)
          .where(inArray(classAbilityLists.id, allListIds))
      : [];

  const listsById = new Map(allLists.map((l) => [l.id, l]));

  // Load all ability items for these lists
  const allItems =
    allListIds.length > 0
      ? await db
          .select()
          .from(classAbilityItems)
          .where(inArray(classAbilityItems.classAbilityListId, allListIds))
      : [];

  const itemsByList = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const existing = itemsByList.get(item.classAbilityListId) || [];
    existing.push(item);
    itemsByList.set(item.classAbilityListId, existing);
  }

  for (const row of rows) {
    const abilities = abilitiesByClass.get(row.id) || [];

    const levelGroups = abilities.reduce(
      (acc, ability) => {
        if (!acc[ability.level]) {
          acc[ability.level] = [];
        }
        acc[ability.level].push({
          id: ability.id,
          name: ability.name,
          description: ability.description,
        });
        return acc;
      },
      {} as Record<
        number,
        Array<{ id: string; name: string; description: string }>
      >
    );

    const levels = Object.entries(levelGroups)
      .map(([level, abs]) => ({
        level: parseInt(level, 10),
        abilities: abs,
      }))
      .sort((a, b) => a.level - b.level);

    const links = linksByClass.get(row.id) || [];
    const sortedLinks = [...links].sort((a, b) => a.orderIndex - b.orderIndex);

    const abilityListsResult: Class["abilityLists"] = [];
    for (const link of sortedLinks) {
      const list = listsById.get(link.abilityListId);
      if (!list) continue;

      const items = (itemsByList.get(list.id) || [])
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
        }));

      abilityListsResult.push({
        id: list.id,
        name: list.name,
        description: list.description,
        characterClass:
          list.characterClass as Class["abilityLists"][number]["characterClass"],
        items,
        creator: OFFICIAL_CREATOR,
        createdAt: list.createdAt ? new Date(list.createdAt) : new Date(),
        updatedAt: list.updatedAt ? new Date(list.updatedAt) : new Date(),
      });
    }

    result.set(row.name, {
      id: row.id,
      name: row.name,
      description: row.description,
      keyStats: (row.keyStats || []) as Class["keyStats"],
      hitDie: row.hitDie as Class["hitDie"],
      startingHp: row.startingHp,
      saves: (row.saves || {}) as Class["saves"],
      armor: (row.armor || []) as Class["armor"],
      weapons: (row.weapons || {}) as Class["weapons"],
      startingGear: (row.startingGear || []) as Class["startingGear"],
      visibility: (row.visibility ?? "public") as "public" | "private",
      levels,
      abilityLists: abilityListsResult,
      creator: OFFICIAL_CREATOR,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
    });
  }

  return result;
};

import { and, asc, desc, eq, inArray, like } from "drizzle-orm";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import type {
  ArmorType,
  Award,
  Class,
  ClassAbility,
  ClassAbilityItem,
  ClassAbilityList,
  ClassLevel,
  ClassMini,
  ClassVisibility,
  HitDieSize,
  Source,
  StatType,
  User,
  WeaponSpec,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { normalizeWeapons } from "@/lib/utils/weapons";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  awards,
  type ClassAbilityItemRow,
  type ClassAbilityListRow,
  type ClassAbilityRow,
  type ClassRow,
  classAbilities,
  classAbilityItems,
  classAbilityLists,
  classes,
  classesAwards,
  classesClassAbilityLists,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "./schema";

const toSource = (s: SourceRow | null): Source | undefined => {
  if (!s) return undefined;
  return {
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  };
};

const toAward = (a: AwardRow): Award => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  abbreviation: a.abbreviation,
  description: a.description,
  url: a.url,
  color: a.color,
  icon: a.icon,
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
});

const toClassMini = (c: ClassRow): ClassMini => ({
  id: c.id,
  name: c.name,
  subclassNamePreface: c.subclassNamePreface,
  visibility: c.visibility as ClassVisibility,
  createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
});

interface ClassFullData {
  class: ClassRow;
  creator: UserRow;
  source: SourceRow | null;
  abilities: ClassAbilityRow[];
  awards: AwardRow[];
  abilityLists: Array<{
    list: ClassAbilityListRow;
    creator: UserRow;
    items: ClassAbilityItemRow[];
  }>;
}

const toClass = (data: ClassFullData): Class => {
  const levelGroups = data.abilities.reduce(
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
    {} as Record<number, ClassAbility[]>
  );

  const levels: ClassLevel[] = Object.entries(levelGroups)
    .map(([level, abilities]) => ({
      level: parseInt(level, 10),
      abilities,
    }))
    .sort((a, b) => a.level - b.level);

  const abilityListsResult: ClassAbilityList[] = data.abilityLists.map(
    (al) => ({
      id: al.list.id,
      name: al.list.name,
      description: al.list.description,
      characterClass: al.list.characterClass || undefined,
      creator: toUser(al.creator),
      createdAt: al.list.createdAt ? new Date(al.list.createdAt) : new Date(),
      updatedAt: al.list.updatedAt ? new Date(al.list.updatedAt) : new Date(),
      items: al.items.map(
        (item): ClassAbilityItem => ({
          id: item.id,
          name: item.name,
          description: item.description,
        })
      ),
    })
  );

  return {
    ...toClassMini(data.class),
    description: data.class.description,
    keyStats: (data.class.keyStats ?? []) as StatType[],
    hitDie: data.class.hitDie as HitDieSize,
    startingHp: data.class.startingHp,
    saves: (data.class.saves ?? {}) as Record<StatType, number>,
    armor: (data.class.armor ?? []) as ArmorType[],
    weapons: normalizeWeapons(data.class.weapons),
    startingGear: (data.class.startingGear ?? []) as string[],
    levels,
    abilityLists: abilityListsResult,
    creator: toUser(data.creator),
    source: toSource(data.source),
    awards: data.awards.length > 0 ? data.awards.map(toAward) : undefined,
    updatedAt: data.class.updatedAt
      ? new Date(data.class.updatedAt)
      : new Date(),
  };
};

async function loadClassFullData(
  db: ReturnType<typeof getDatabase>,
  classIds: string[]
): Promise<Map<string, ClassFullData>> {
  if (classIds.length === 0) return new Map();

  const classRows = await db
    .select()
    .from(classes)
    .innerJoin(users, eq(classes.userId, users.id))
    .leftJoin(sources, eq(classes.sourceId, sources.id))
    .where(inArray(classes.id, classIds));

  const abilityRows = await db
    .select()
    .from(classAbilities)
    .where(inArray(classAbilities.classId, classIds))
    .orderBy(asc(classAbilities.level), asc(classAbilities.orderIndex));

  const awardRows = await db
    .select({ classId: classesAwards.classId, award: awards })
    .from(classesAwards)
    .innerJoin(awards, eq(classesAwards.awardId, awards.id))
    .where(inArray(classesAwards.classId, classIds));

  const linkRows = await db
    .select()
    .from(classesClassAbilityLists)
    .where(inArray(classesClassAbilityLists.classId, classIds))
    .orderBy(asc(classesClassAbilityLists.orderIndex));

  const listIds = [...new Set(linkRows.map((l) => l.abilityListId))];

  const listDataMap = new Map<
    string,
    { list: ClassAbilityListRow; creator: UserRow }
  >();
  const itemsByList = new Map<string, ClassAbilityItemRow[]>();

  if (listIds.length > 0) {
    const listRows = await db
      .select()
      .from(classAbilityLists)
      .innerJoin(users, eq(classAbilityLists.userId, users.id))
      .where(inArray(classAbilityLists.id, listIds));

    for (const row of listRows) {
      listDataMap.set(row.class_ability_lists.id, {
        list: row.class_ability_lists,
        creator: row.users,
      });
    }

    const itemRows = await db
      .select()
      .from(classAbilityItems)
      .where(inArray(classAbilityItems.classAbilityListId, listIds))
      .orderBy(asc(classAbilityItems.orderIndex));

    for (const item of itemRows) {
      const existing = itemsByList.get(item.classAbilityListId) || [];
      existing.push(item);
      itemsByList.set(item.classAbilityListId, existing);
    }
  }

  const abilitiesByClass = new Map<string, ClassAbilityRow[]>();
  for (const ability of abilityRows) {
    const existing = abilitiesByClass.get(ability.classId) || [];
    existing.push(ability);
    abilitiesByClass.set(ability.classId, existing);
  }

  const awardsByClass = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByClass.get(row.classId) || [];
    existing.push(row.award);
    awardsByClass.set(row.classId, existing);
  }

  const listLinksByClass = new Map<
    string,
    Array<{
      list: ClassAbilityListRow;
      creator: UserRow;
      items: ClassAbilityItemRow[];
    }>
  >();
  for (const link of linkRows) {
    const listData = listDataMap.get(link.abilityListId);
    if (!listData) continue;
    const existing = listLinksByClass.get(link.classId) || [];
    existing.push({
      ...listData,
      items: itemsByList.get(link.abilityListId) || [],
    });
    listLinksByClass.set(link.classId, existing);
  }

  const result = new Map<string, ClassFullData>();
  for (const row of classRows) {
    result.set(row.classes.id, {
      class: row.classes,
      creator: row.users,
      source: row.sources,
      abilities: abilitiesByClass.get(row.classes.id) || [],
      awards: awardsByClass.get(row.classes.id) || [],
      abilityLists: listLinksByClass.get(row.classes.id) || [],
    });
  }

  return result;
}

export const deleteClass = async (input: {
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
    .delete(classes)
    .where(and(eq(classes.id, input.id), eq(classes.userId, userResult[0].id)));

  return result.rowsAffected > 0;
};

export const listPublicClasses = async (
  officialOnly = false
): Promise<Class[]> => {
  const db = getDatabase();

  const conditions = [eq(classes.visibility, "public")];
  if (officialOnly) {
    conditions.push(eq(classes.userId, OFFICIAL_USER_ID));
  }
  const classRows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(...conditions))
    .orderBy(asc(classes.name));

  if (classRows.length === 0) return [];

  const ids = classRows.map((r) => r.id);
  const dataMap = await loadClassFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is ClassFullData => d !== undefined)
    .map(toClass);
};

export const findClass = async (id: string): Promise<Class | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();
  const dataMap = await loadClassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toClass(data) : null;
};

export const findPublicClassById = async (
  id: string
): Promise<Class | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const check = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.visibility, "public")))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadClassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toClass(data) : null;
};

export const findClassWithCreatorDiscordId = async (
  id: string,
  discordId: string
): Promise<Class | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;

  const check = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.userId, userResult[0].id)))
    .limit(1);

  if (check.length === 0) return null;

  const dataMap = await loadClassFullData(db, [id]);
  const data = dataMap.get(id);

  return data ? toClass(data) : null;
};

export const listPublicClassesForUser = async (
  userId: string
): Promise<Class[]> => {
  const db = getDatabase();

  const classRows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.userId, userId), eq(classes.visibility, "public")))
    .orderBy(asc(classes.name));

  if (classRows.length === 0) return [];

  const ids = classRows.map((r) => r.id);
  const dataMap = await loadClassFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is ClassFullData => d !== undefined)
    .map(toClass);
};

export const listAllClassesForDiscordID = async (
  discordId: string
): Promise<Class[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];

  const classRows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.userId, userResult[0].id))
    .orderBy(asc(classes.name));

  if (classRows.length === 0) return [];

  const ids = classRows.map((r) => r.id);
  const dataMap = await loadClassFullData(db, ids);

  return ids
    .map((id) => dataMap.get(id))
    .filter((d): d is ClassFullData => d !== undefined)
    .map(toClass);
};

export interface SearchClassesParams {
  searchTerm?: string;
  creatorId?: string;
  sortBy?: "name";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicClassMinis = async (
  params: SearchClassesParams
): Promise<ClassMini[]> => {
  const db = getDatabase();

  const conditions: ReturnType<typeof eq>[] = [
    eq(classes.visibility, "public"),
  ];

  if (params.creatorId) {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.discordId, params.creatorId))
      .limit(1);

    if (userResult.length > 0) {
      conditions.push(eq(classes.userId, userResult[0].id));
    }
  }

  let query = db.select().from(classes).$dynamic();

  if (params.searchTerm) {
    const searchCondition = like(classes.name, `%${params.searchTerm}%`);
    query = query.where(and(...conditions, searchCondition));
  } else {
    query = query.where(and(...conditions));
  }

  const orderFn = params.sortDirection === "desc" ? desc : asc;
  query = query.orderBy(orderFn(classes.name));

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const rows = await query;
  return rows.map(toClassMini);
};

export const searchPublicClassesWithCreator = async (
  searchTerm?: string
): Promise<(ClassMini & { creator: User })[]> => {
  const db = getDatabase();

  const conditions = [eq(classes.visibility, "public")];

  if (searchTerm) {
    conditions.push(like(classes.name, `%${searchTerm}%`));
  }

  const rows = await db
    .select({ class: classes, user: users })
    .from(classes)
    .innerJoin(users, eq(classes.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(classes.name));

  return rows.map((r) => ({
    ...toClassMini(r.class),
    creator: toUser(r.user),
  }));
};

export interface CreateClassInput {
  name: string;
  description: string;
  keyStats: StatType[];
  hitDie: HitDieSize;
  startingHp: number;
  saves: Record<StatType, number>;
  armor: ArmorType[];
  weapons: WeaponSpec[];
  startingGear: string[];
  levels: ClassLevel[];
  abilityLists: Array<{
    name: string;
    description: string;
    items: Array<{ name: string; description: string }>;
  }>;
  visibility: ClassVisibility;
  discordId: string;
}

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const classId = crypto.randomUUID();

  const abilityInserts = input.levels.flatMap((level) =>
    level.abilities.map((ability, index) => ({
      id: crypto.randomUUID(),
      classId,
      level: level.level,
      name: ability.name,
      description: ability.description,
      orderIndex: index,
    }))
  );

  await db.transaction(async (tx) => {
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
      visibility: input.visibility,
      userId: userResult[0].id,
    });

    if (abilityInserts.length > 0) {
      await tx.insert(classAbilities).values(abilityInserts);
    }

    for (const [index, list] of input.abilityLists.entries()) {
      const listId = crypto.randomUUID();
      await tx.insert(classAbilityLists).values({
        id: listId,
        name: list.name,
        description: list.description,
        userId: userResult[0].id,
      });
      if (list.items.length > 0) {
        await tx.insert(classAbilityItems).values(
          list.items.map((item, itemIndex) => ({
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
        orderIndex: index,
      });
    }
  });

  const dataMap = await loadClassFullData(db, [classId]);
  const data = dataMap.get(classId);

  if (!data) {
    throw new Error("Failed to create class");
  }

  return toClass(data);
};

export interface UpdateClassInput extends CreateClassInput {
  id: string;
}

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const existing = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, input.id), eq(classes.userId, userResult[0].id)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Class not found");
  }

  const abilityInserts = input.levels.flatMap((level) =>
    level.abilities.map((ability, index) => ({
      id: crypto.randomUUID(),
      classId: input.id,
      level: level.level,
      name: ability.name,
      description: ability.description,
      orderIndex: index,
    }))
  );

  await db.transaction(async (tx) => {
    await tx
      .update(classes)
      .set({
        name: input.name,
        description: input.description,
        keyStats: input.keyStats,
        hitDie: input.hitDie,
        startingHp: input.startingHp,
        saves: input.saves,
        armor: input.armor,
        weapons: input.weapons,
        startingGear: input.startingGear,
        visibility: input.visibility,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(classes.id, input.id));

    await tx.delete(classAbilities).where(eq(classAbilities.classId, input.id));

    if (abilityInserts.length > 0) {
      await tx.insert(classAbilities).values(abilityInserts);
    }

    // Delete old ability lists (cascades to items and join table entries)
    const existingLinks = await tx
      .select({ abilityListId: classesClassAbilityLists.abilityListId })
      .from(classesClassAbilityLists)
      .where(eq(classesClassAbilityLists.classId, input.id));
    const existingListIds = existingLinks.map((l) => l.abilityListId);
    if (existingListIds.length > 0) {
      await tx
        .delete(classAbilityLists)
        .where(inArray(classAbilityLists.id, existingListIds));
    }

    // Create new ability lists
    for (const [index, list] of input.abilityLists.entries()) {
      const listId = crypto.randomUUID();
      await tx.insert(classAbilityLists).values({
        id: listId,
        name: list.name,
        description: list.description,
        userId: userResult[0].id,
      });
      if (list.items.length > 0) {
        await tx.insert(classAbilityItems).values(
          list.items.map((item, itemIndex) => ({
            id: crypto.randomUUID(),
            classAbilityListId: listId,
            name: item.name,
            description: item.description,
            orderIndex: itemIndex,
          }))
        );
      }
      await tx.insert(classesClassAbilityLists).values({
        classId: input.id,
        abilityListId: listId,
        orderIndex: index,
      });
    }
  });

  const dataMap = await loadClassFullData(db, [input.id]);
  const data = dataMap.get(input.id);

  if (!data) {
    throw new Error("Failed to update class");
  }

  return toClass(data);
};

export interface SubclassClassOption {
  id: string;
  name: string;
  subclassNamePreface: string;
  creatorImageUrl: string;
  bucket: "owned" | "official" | "public";
}

export const searchClassesForSubclass = async (params: {
  userId?: string;
  searchTerm?: string;
}): Promise<SubclassClassOption[]> => {
  const db = getDatabase();
  const OFFICIAL_USER_ID = "00000000-0000-0000-0000-000000000000";

  const conditions = [eq(classes.visibility, "public")];
  if (params.searchTerm) {
    conditions.push(like(classes.name, `%${params.searchTerm}%`));
  }

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      subclassNamePreface: classes.subclassNamePreface,
      userId: classes.userId,
      user: users,
    })
    .from(classes)
    .innerJoin(users, eq(classes.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(classes.name))
    .limit(50);

  // If user is logged in, also fetch their private classes
  let ownedRows: typeof rows = [];
  if (params.userId) {
    const ownedConditions = [eq(classes.userId, params.userId)];
    if (params.searchTerm) {
      ownedConditions.push(like(classes.name, `%${params.searchTerm}%`));
    }
    ownedRows = await db
      .select({
        id: classes.id,
        name: classes.name,
        subclassNamePreface: classes.subclassNamePreface,
        userId: classes.userId,
        user: users,
      })
      .from(classes)
      .innerJoin(users, eq(classes.userId, users.id))
      .where(and(...ownedConditions))
      .orderBy(asc(classes.name))
      .limit(50);
  }

  const seenIds = new Set<string>();
  const results: SubclassClassOption[] = [];

  // User's own classes first
  for (const row of ownedRows) {
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id);
      results.push({
        id: row.id,
        name: row.name,
        subclassNamePreface: row.subclassNamePreface,
        creatorImageUrl: toUser(row.user).imageUrl ?? "",
        bucket: "owned",
      });
    }
  }

  // Then official, then other public
  for (const row of rows) {
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id);
      results.push({
        id: row.id,
        name: row.name,
        subclassNamePreface: row.subclassNamePreface,
        creatorImageUrl: toUser(row.user).imageUrl ?? "",
        bucket: row.userId === OFFICIAL_USER_ID ? "official" : "public",
      });
    }
  }

  return results;
};

export const findClassesByIds = async (ids: string[]): Promise<Class[]> => {
  const validIds = ids.filter(isValidUUID);
  if (validIds.length === 0) return [];

  const db = getDatabase();
  const dataMap = await loadClassFullData(db, validIds);

  return validIds
    .map((id) => dataMap.get(id))
    .filter((d): d is ClassFullData => d !== undefined)
    .map(toClass);
};

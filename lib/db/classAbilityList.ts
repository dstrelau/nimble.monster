import { asc, eq } from "drizzle-orm";
import type {
  ClassAbilityItem,
  ClassAbilityList,
  ClassAbilityListMini,
  SubclassClass,
  User,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type ClassAbilityItemRow,
  type ClassAbilityListRow,
  classAbilityItems,
  classAbilityLists,
  type UserRow,
  users,
} from "./schema";

const toUser = (u: UserRow): User => ({
  id: u.id,
  discordId: u.discordId ?? "",
  username: u.username ?? "",
  displayName: u.displayName || u.username || "",
  imageUrl:
    u.imageUrl ||
    (u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png"),
});

const toClassAbilityListMini = (
  list: ClassAbilityListRow
): ClassAbilityListMini => ({
  id: list.id,
  name: list.name,
  description: list.description,
  characterClass: list.characterClass
    ? (list.characterClass as SubclassClass)
    : undefined,
  createdAt: list.createdAt ? new Date(list.createdAt) : new Date(),
});

const toClassAbilityList = (
  list: ClassAbilityListRow,
  creator: UserRow,
  items: ClassAbilityItemRow[]
): ClassAbilityList => ({
  ...toClassAbilityListMini(list),
  updatedAt: list.updatedAt ? new Date(list.updatedAt) : new Date(),
  creator: toUser(creator),
  items: items.map(
    (item): ClassAbilityItem => ({
      id: item.id,
      name: item.name,
      description: item.description,
    })
  ),
});

export const deleteClassAbilityList = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(classAbilityLists)
    .where(eq(classAbilityLists.id, id));

  return result.rowsAffected > 0;
};

export const findClassAbilityList = async (
  id: string
): Promise<ClassAbilityList | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const listRows = await db
    .select()
    .from(classAbilityLists)
    .innerJoin(users, eq(classAbilityLists.userId, users.id))
    .where(eq(classAbilityLists.id, id))
    .limit(1);

  if (listRows.length === 0) return null;

  const row = listRows[0];
  const items = await db
    .select()
    .from(classAbilityItems)
    .where(eq(classAbilityItems.classAbilityListId, id))
    .orderBy(asc(classAbilityItems.orderIndex));

  return toClassAbilityList(row.class_ability_lists, row.users, items);
};

export const getUserClassAbilityLists = async (
  discordId: string
): Promise<ClassAbilityListMini[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];

  const lists = await db
    .select()
    .from(classAbilityLists)
    .where(eq(classAbilityLists.userId, userResult[0].id))
    .orderBy(asc(classAbilityLists.name));

  return lists.map(toClassAbilityListMini);
};

export interface CreateClassAbilityListInput {
  name: string;
  description: string;
  characterClass?: string;
  items: Array<{ name: string; description: string }>;
  discordId: string;
}

export const createClassAbilityList = async (
  input: CreateClassAbilityListInput
): Promise<ClassAbilityList> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const listId = crypto.randomUUID();

  await db.insert(classAbilityLists).values({
    id: listId,
    name: input.name,
    description: input.description,
    characterClass: input.characterClass || null,
    userId: userResult[0].id,
  });

  if (input.items.length > 0) {
    await db.insert(classAbilityItems).values(
      input.items.map((item, index) => ({
        id: crypto.randomUUID(),
        classAbilityListId: listId,
        name: item.name,
        description: item.description,
        orderIndex: index,
      }))
    );
  }

  const items = await db
    .select()
    .from(classAbilityItems)
    .where(eq(classAbilityItems.classAbilityListId, listId))
    .orderBy(asc(classAbilityItems.orderIndex));

  const listRows = await db
    .select()
    .from(classAbilityLists)
    .where(eq(classAbilityLists.id, listId))
    .limit(1);

  return toClassAbilityList(listRows[0], userResult[0], items);
};

export interface UpdateClassAbilityListInput {
  id: string;
  name: string;
  description: string;
  characterClass?: string;
  items: ClassAbilityItem[];
  discordId: string;
}

export const updateClassAbilityList = async (
  input: UpdateClassAbilityListInput
): Promise<ClassAbilityList> => {
  if (!isValidUUID(input.id)) {
    throw new Error("Invalid class ability list ID");
  }

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  await db
    .update(classAbilityLists)
    .set({
      name: input.name,
      description: input.description,
      characterClass: input.characterClass || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(classAbilityLists.id, input.id));

  // Replace items
  await db
    .delete(classAbilityItems)
    .where(eq(classAbilityItems.classAbilityListId, input.id));

  if (input.items.length > 0) {
    await db.insert(classAbilityItems).values(
      input.items.map((item, index) => ({
        id: crypto.randomUUID(),
        classAbilityListId: input.id,
        name: item.name,
        description: item.description,
        orderIndex: index,
      }))
    );
  }

  const items = await db
    .select()
    .from(classAbilityItems)
    .where(eq(classAbilityItems.classAbilityListId, input.id))
    .orderBy(asc(classAbilityItems.orderIndex));

  const listRows = await db
    .select()
    .from(classAbilityLists)
    .where(eq(classAbilityLists.id, input.id))
    .limit(1);

  return toClassAbilityList(listRows[0], userResult[0], items);
};

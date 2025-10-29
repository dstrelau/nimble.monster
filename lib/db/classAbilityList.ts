import type {
  ClassAbilityItem,
  ClassAbilityList,
  ClassAbilityListMini,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toClassAbilityList } from "./converters";
import { prisma } from "./index";

export const deleteClassAbilityList = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const list = await prisma.classAbilityList.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!list;
};

export const findClassAbilityList = async (
  id: string
): Promise<ClassAbilityList | null> => {
  const list = await prisma.classAbilityList.findUnique({
    where: { id },
    include: {
      creator: true,
      items: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  return list ? toClassAbilityList(list) : null;
};

export const getUserClassAbilityLists = async (
  discordId: string
): Promise<ClassAbilityListMini[]> => {
  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    return [];
  }

  const lists = await prisma.classAbilityList.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      characterClass: true,
      createdAt: true,
    },
  });

  return lists.map((list) => ({
    ...list,
    characterClass:
      list.characterClass as ClassAbilityListMini["characterClass"],
  }));
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
  const { name, description, characterClass, items, discordId } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdList = await prisma.classAbilityList.create({
    data: {
      name,
      description,
      characterClass,
      creator: {
        connect: { id: user.id },
      },
      items: {
        create: items.map((item, index) => ({
          name: item.name,
          description: item.description,
          orderIndex: index,
        })),
      },
    },
    include: {
      creator: true,
      items: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return toClassAbilityList(createdList);
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
  const { id, name, description, characterClass, items, discordId } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid class ability list ID");
  }

  const updatedList = await prisma.classAbilityList.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      description,
      characterClass,
      items: {
        deleteMany: {},
        create: items.map((item, index) => ({
          name: item.name,
          description: item.description,
          orderIndex: index,
        })),
      },
    },
    include: {
      creator: true,
      items: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return toClassAbilityList(updatedList);
};

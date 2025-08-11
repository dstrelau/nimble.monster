import type { Ability, Family } from "@/lib/types";
import { toMonster } from "./converters";
import { prisma } from "./index";

export const getUserFamilies = async (discordId: string): Promise<Family[]> => {
  const families = await prisma.family.findMany({
    where: {
      creator: { discordId },
    },
    include: {
      monsters: {
        include: { creator: true, family: true },
      },
      creator: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return families.map((family) => ({
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    visibility: family.visibility,
    monsters: family.monsters.map(toMonster),
    monsterCount: family.monsters.length,
    creatorId: family.creator.discordId,
  }));
};

export const getUserPublicFamiliesWithMonsters = async (
  discordId: string
): Promise<Family[]> => {
  const families = await prisma.family.findMany({
    where: {
      creator: { discordId },
    },
    include: {
      monsters: {
        where: {
          visibility: "public",
        },
        include: { creator: true, family: true },
      },
      creator: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return families.map((family) => ({
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    visibility: family.visibility,
    monsters: family.monsters.map(toMonster),
    monsterCount: family.monsters.length,
    creatorId: family.creator.discordId,
  }));
};

export const getUserPublicFamiliesCount = async (
  username: string
): Promise<number> => {
  return await prisma.family.count({
    where: {
      creator: { username },
      visibility: "public",
    },
  });
};

export const getFamily = async (id: string): Promise<Family | null> => {
  const family = await prisma.family.findUnique({
    where: {
      id,
    },
    include: {
      monsters: true,
      creator: true,
    },
  });

  if (!family) return null;

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    monsterCount: family.monsters.length,
    creatorId: family.creator.discordId,
    creator: { ...family.creator, avatar: family.creator.avatar || "" },
  };
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
}: CreateFamilyInput): Promise<Family> => {
  const family = await prisma.family.create({
    data: {
      name: name,
      description: description,
      abilities: abilities.map((a) => ({ ...a })),
      visibility: "public", // not used
      creator: {
        connect: { discordId },
      },
    },
  });

  const monsterCount = await prisma.monster.count({
    where: {
      family_id: family.id,
    },
  });

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    monsterCount: monsterCount,
    creatorId: discordId,
  };
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
}): Promise<Family | null> => {
  const family = await prisma.family.update({
    where: {
      id: id,
      creator: { discordId },
    },
    include: {
      creator: true,
    },
    data: {
      name: name,
      description: description === "" ? null : description,
      abilities: abilities.map((a) => ({
        ...a,
        Name: undefined,
        Description: undefined,
      })),
    },
  });

  if (!family) return null;

  const monsterCount = await prisma.monster.count({
    where: {
      family_id: family.id,
    },
  });

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    monsterCount: monsterCount,
    creatorId: family.creator.discordId,
  };
};

export const deleteFamily = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  const family = await prisma.family.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });
  return !!family;
};

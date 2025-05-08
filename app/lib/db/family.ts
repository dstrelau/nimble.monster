import { Ability, Family } from "@/lib/types";
import { prisma } from "./index";

export const getUserFamilies = async (discordId: string): Promise<Family[]> => {
  const families = await prisma.family.findMany({
    where: {
      creator: { discordId },
    },
    include: {
      monsters: true,
      creator: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return families.map((family) => ({
    id: family.id,
    name: family.name,
    abilities: family.abilities as unknown as Ability[],
    visibility: family.visibility,
    monsterCount: family.monsters.length,
    creatorId: family.creator.discordId,
  }));
};

export const getUserPublicFamiliesCount = async (
  username: string,
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
    abilities: family.abilities as unknown as Ability[],
    monsterCount: family.monsters.length,
    creatorId: family.creator.discordId,
  };
};

export interface CreateFamilyInput {
  name: string;
  abilities: Ability[];
  discordId: string;
}

export const createFamily = async ({
  name,
  abilities,
  discordId,
}: CreateFamilyInput): Promise<Family> => {
  const family = await prisma.family.create({
    data: {
      name: name,
      abilities: abilities.map((a) => ({
        ...a,
        Name: undefined,
        Description: undefined,
      })),
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
    abilities: family.abilities as unknown as Ability[],
    monsterCount: monsterCount,
    creatorId: discordId,
  };
};

export const updateFamily = async ({
  id,
  name,
  abilities,
  discordId,
}: {
  id: string;
  name: string;
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

import type { Ability, Family, FamilyOverview } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toMonster } from "../services/monsters/converters";
import { toUser } from "./converters";
import { prisma } from "./index";

export const getUserFamilies = async (discordId: string): Promise<Family[]> => {
  const families = await prisma.family.findMany({
    where: {
      creator: { discordId },
    },
    include: {
      monsters: {
        include: {
          creator: true,
          family: { include: { creator: true } },
          monsterConditions: { include: { condition: true } },
        },
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
    creator: toUser(family.creator),
  }));
};

export const listPublicFamiliesHavingMonstersForUser = async (
  creatorId: string
): Promise<Family[]> => {
  const families = await prisma.family.findMany({
    where: { creatorId },
    include: {
      monsters: {
        where: {
          visibility: "public",
        },
        include: {
          creator: true,
          family: { include: { creator: true } },
          monsterConditions: { include: { condition: true } },
        },
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
    creator: toUser(family.creator),
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

export const getFamily = async (id: string): Promise<FamilyOverview | null> => {
  const family = await prisma.family.findUnique({
    where: { id },
    include: {
      _count: { select: { monsters: true } },
      creator: true,
    },
  });

  if (!family) return null;

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    monsterCount: family._count.monsters,
    creatorId: family.creator.discordId,
    creator: toUser(family.creator),
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
}: CreateFamilyInput): Promise<FamilyOverview> => {
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

  const creator = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!creator) {
    throw new Error("Creator not found");
  }

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: family.abilities as unknown as Ability[],
    monsterCount: monsterCount,
    creatorId: discordId,
    creator: toUser(creator),
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
}): Promise<FamilyOverview> => {
  if (!isValidUUID(id)) {
    throw new Error("family not found");
  }

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

  if (!family) throw new Error("family not found");

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
    creator: toUser(family.creator),
  };
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

  const family = await prisma.family.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });
  return !!family;
};

export const getRandomFeaturedFamily = async (): Promise<Family | null> => {
  const featuredFamilies = await prisma.family.findMany({
    where: {
      featured: true,
    },
    include: {
      monsters: {
        where: {
          visibility: "public",
        },
        include: {
          creator: true,
          family: { include: { creator: true } },
          monsterConditions: { include: { condition: true } },
        },
        orderBy: { levelInt: "asc" },
      },
      creator: true,
    },
  });
  const familiesWithMonsters = featuredFamilies.filter(
    (family) => family.monsters.length > 0
  );

  if (familiesWithMonsters.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * familiesWithMonsters.length);
  const family = familiesWithMonsters[randomIndex];

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: (family.abilities as unknown as Omit<Ability, "id">[]).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: family.visibility,
    monsters: family.monsters.map(toMonster),
    monsterCount: family.monsters.length,
    creatorId: family.creator.discordId,
    creator: toUser(family.creator),
  };
};

import type { Ability, Family, FamilyOverview } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toMonster } from "../services/monsters/converters";
import { toUser } from "./converters";
import { prisma } from "./index";

export const listFamiliesForUser = async (
  discordId: string
): Promise<FamilyOverview[]> => {
  const families = await prisma.family.findMany({
    where: { creator: { discordId } },
    include: {
      monsterFamilies: true,
      creator: true,
    },
    orderBy: { name: "asc" },
  });

  return families.map((family) => ({
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
    monsterCount: family.monsterFamilies.length,
    creatorId: family.creator.discordId,
    creator: toUser(family.creator),
  }));
};

export const getUserFamiliesWithMonsters = async (
  discordId: string
): Promise<Family[]> => {
  const families = await prisma.family.findMany({
    where: {
      creator: { discordId },
    },
    include: {
      monsterFamilies: {
        include: {
          monster: {
            include: {
              creator: true,
              source: true,
              monsterFamilies: {
                include: { family: { include: { creator: true } } },
              },
              monsterConditions: { include: { condition: true } },
              monsterAwards: { include: { award: true } },
            },
          },
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
    abilities: (family.abilities as unknown as Omit<Ability, "id">[]).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: family.visibility,
    monsters: family.monsterFamilies.map((mf) => toMonster(mf.monster)),
    monsterCount: family.monsterFamilies.length,
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
      monsterFamilies: {
        where: {
          monster: { visibility: "public" },
        },
        include: {
          monster: {
            include: {
              creator: true,
              source: true,
              monsterFamilies: {
                include: { family: { include: { creator: true } } },
              },
              monsterConditions: { include: { condition: true } },
              monsterAwards: { include: { award: true } },
            },
          },
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
    abilities: (family.abilities as unknown as Omit<Ability, "id">[]).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: family.visibility,
    monsters: family.monsterFamilies.map((mf) => toMonster(mf.monster)),
    monsterCount: family.monsterFamilies.length,
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
      _count: { select: { monsterFamilies: true } },
      creator: true,
    },
  });

  if (!family) return null;

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
    monsterCount: family._count.monsterFamilies,
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

  const monsterCount = await prisma.monsterFamily.count({
    where: {
      familyId: family.id,
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

  const monsterCount = await prisma.monsterFamily.count({
    where: {
      familyId: family.id,
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
      monsterFamilies: {
        where: {
          monster: { visibility: "public" },
        },
        include: {
          monster: {
            include: {
              creator: true,
              source: true,
              monsterFamilies: {
                include: { family: { include: { creator: true } } },
              },
              monsterConditions: { include: { condition: true } },
              monsterAwards: { include: { award: true } },
            },
          },
        },
        orderBy: { monster: { levelInt: "asc" } },
      },
      creator: true,
    },
  });
  const familiesWithMonsters = featuredFamilies.filter(
    (family) => family.monsterFamilies.length > 0
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
    monsters: family.monsterFamilies.map((mf) => toMonster(mf.monster)),
    monsterCount: family.monsterFamilies.length,
    creatorId: family.creator.discordId,
    creator: toUser(family.creator),
  };
};

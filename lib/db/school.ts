import type {
  SpellSchool,
  SpellSchoolMini,
  SpellSchoolVisibility,
  SpellTarget,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toSpellSchool, toSpellSchoolMini } from "./converters";
import { prisma } from "./index";

export const deleteSpellSchool = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const spellSchool = await prisma.spellSchool.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!spellSchool;
};

export const listPublicSpellSchools = async (): Promise<SpellSchool[]> => {
  return (
    await prisma.spellSchool.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: {
        creator: true,
        spells: {
          orderBy: { name: "asc" },
        },
      },
    })
  ).map(toSpellSchool);
};

export const findSpellSchool = async (
  id: string
): Promise<SpellSchool | null> => {
  const spellSchool = await prisma.spellSchool.findUnique({
    where: { id },
    include: {
      creator: true,
      spells: {
        orderBy: { name: "asc" },
      },
    },
  });
  return spellSchool ? toSpellSchool(spellSchool) : null;
};

export const findSpellSchoolWithCreatorDiscordId = async (
  id: string,
  creatorDiscordId: string
): Promise<SpellSchool | null> => {
  if (!isValidUUID(id)) return null;

  const spellSchool = await prisma.spellSchool.findUnique({
    where: { id, creator: { discordId: creatorDiscordId } },
    include: {
      creator: true,
      spells: {
        orderBy: { name: "asc" },
      },
    },
  });
  return spellSchool ? toSpellSchool(spellSchool) : null;
};

export const listAllSpellSchoolsForDiscordID = async (
  discordId: string
): Promise<SpellSchool[]> => {
  return (
    await prisma.spellSchool.findMany({
      include: {
        creator: true,
        spells: {
          orderBy: { name: "asc" },
        },
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toSpellSchool);
};

export interface SearchSpellSchoolsParams {
  searchTerm?: string;
  creatorId?: string;
  sortBy?: "name";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicSpellSchoolMinis = async ({
  searchTerm,
  creatorId: discordId,
  sortDirection = "asc",
  limit = 500,
}: SearchSpellSchoolsParams): Promise<SpellSchoolMini[]> => {
  const whereClause: {
    creator?: { discordId?: string };
    visibility: "public";
    name?: { contains: string; mode: "insensitive" };
  } = {
    visibility: "public",
  };

  if (discordId) {
    whereClause.creator = { discordId: discordId };
  }

  if (searchTerm) {
    whereClause.name = { contains: searchTerm, mode: "insensitive" };
  }

  const orderBy = { name: sortDirection };

  return (
    await prisma.spellSchool.findMany({
      where: whereClause,
      orderBy,
      take: limit,
    })
  ).map(toSpellSchoolMini);
};

export interface CreateSpellSchoolInput {
  name: string;
  description?: string;
  spells: {
    name: string;
    tier: number;
    actions: number;
    reaction: boolean;
    target?: SpellTarget;
    damage?: string;
    description: string;
    highLevels?: string;
    concentration?: string;
    upcast?: string;
  }[];
  visibility: SpellSchoolVisibility;
  discordId: string;
}

export const createSpellSchool = async (
  input: CreateSpellSchoolInput
): Promise<SpellSchool> => {
  const { name, description, spells, visibility, discordId } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdSpellSchool = await prisma.spellSchool.create({
    data: {
      name,
      description,
      visibility,
      creator: {
        connect: { id: user.id },
      },
      spells: {
        create: spells.map((spell) => ({
          name: spell.name,
          tier: spell.tier,
          actions: spell.actions,
          reaction: spell.reaction,
          targetType: spell.target?.type,
          targetKind:
            spell.target && "kind" in spell.target
              ? spell.target.kind
              : undefined,
          targetDistance:
            spell.target && "distance" in spell.target
              ? spell.target.distance
              : undefined,
          damage: spell.damage,
          description: spell.description,
          highLevels: spell.highLevels,
          concentration: spell.concentration,
          upcast: spell.upcast,
        })),
      },
    },
    include: {
      creator: true,
      spells: {
        orderBy: { name: "asc" },
      },
    },
  });

  return toSpellSchool(createdSpellSchool);
};

export interface UpdateSpellSchoolInput {
  id: string;
  name: string;
  description?: string;
  spells: {
    name: string;
    tier: number;
    actions: number;
    reaction: boolean;
    target?: SpellTarget;
    damage?: string;
    description: string;
    highLevels?: string;
    concentration?: string;
    upcast?: string;
  }[];
  visibility: SpellSchoolVisibility;
  discordId: string;
}

export const updateSpellSchool = async (
  input: UpdateSpellSchoolInput
): Promise<SpellSchool> => {
  const { id, name, description, spells, visibility, discordId } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid spell school ID");
  }

  const updatedSpellSchool = await prisma.spellSchool.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      description,
      visibility,
      spells: {
        deleteMany: {},
        create: spells.map((spell) => ({
          name: spell.name,
          tier: spell.tier,
          actions: spell.actions,
          reaction: spell.reaction,
          targetType: spell.target?.type,
          targetKind:
            spell.target && "kind" in spell.target
              ? spell.target.kind
              : undefined,
          targetDistance:
            spell.target && "distance" in spell.target
              ? spell.target.distance
              : undefined,
          damage: spell.damage,
          description: spell.description,
          highLevels: spell.highLevels,
          concentration: spell.concentration,
          upcast: spell.upcast,
        })),
      },
    },
    include: {
      creator: true,
      spells: {
        orderBy: { name: "asc" },
      },
    },
  });

  return toSpellSchool(updatedSpellSchool);
};

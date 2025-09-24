import type {
  Subclass,
  SubclassClass,
  SubclassLevel,
  SubclassMini,
  SubclassVisibility,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toSubclass, toSubclassMini } from "./converters";
import { prisma } from "./index";

export const deleteSubclass = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const subclass = await prisma.subclass.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!subclass;
};

export const listPublicSubclasses = async (): Promise<Subclass[]> => {
  return (
    await prisma.subclass.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: {
        creator: true,
        abilities: {
          orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
        },
      },
    })
  ).map(toSubclass);
};

export const findSubclass = async (id: string): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const subclass = await prisma.subclass.findUnique({
    where: { id },
    include: {
      creator: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
    },
  });
  return subclass ? toSubclass(subclass) : null;
};

export const findPublicSubclassById = async (
  id: string
): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const subclass = await prisma.subclass.findUnique({
    where: { id, visibility: "public" },
    include: {
      creator: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
    },
  });
  return subclass ? toSubclass(subclass) : null;
};

export const findSubclassWithCreatorDiscordId = async (
  id: string,
  creatorDiscordId: string
): Promise<Subclass | null> => {
  if (!isValidUUID(id)) return null;

  const subclass = await prisma.subclass.findUnique({
    where: { id, creator: { discordId: creatorDiscordId } },
    include: {
      creator: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
    },
  });
  return subclass ? toSubclass(subclass) : null;
};

export const listPublicSubclassesForUser = async (
  userId: string
): Promise<Subclass[]> => {
  return (
    await prisma.subclass.findMany({
      include: {
        creator: true,
        abilities: {
          orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
        },
      },
      where: {
        userId,
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toSubclass);
};

export const listAllSubclassesForDiscordID = async (
  discordId: string
): Promise<Subclass[]> => {
  return (
    await prisma.subclass.findMany({
      include: {
        creator: true,
        abilities: {
          orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
        },
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toSubclass);
};

export interface SearchSubclassesParams {
  searchTerm?: string;
  className?: string;
  creatorId?: string;
  sortBy?: "name" | "className";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicSubclassMinis = async ({
  searchTerm,
  className,
  creatorId: discordId,
  sortBy = "name",
  sortDirection = "asc",
  limit = 500,
}: SearchSubclassesParams): Promise<SubclassMini[]> => {
  const whereClause: {
    creator?: { discordId?: string };
    visibility: "public";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      className?: { contains: string; mode: "insensitive" };
    }>;
    className?: { contains: string; mode: "insensitive" };
  } = {
    visibility: "public",
  };

  if (discordId) {
    whereClause.creator = { discordId: discordId };
  }

  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { className: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (className) {
    whereClause.className = { contains: className, mode: "insensitive" };
  }

  let orderBy: { name: "asc" | "desc" } | { className: "asc" | "desc" } = {
    name: "asc",
  };

  if (sortBy === "name") {
    orderBy = { name: sortDirection };
  } else if (sortBy === "className") {
    orderBy = { className: sortDirection };
  }

  return (
    await prisma.subclass.findMany({
      where: whereClause,
      orderBy,
      take: limit,
    })
  ).map(toSubclassMini);
};

export interface CreateSubclassInput {
  name: string;
  className: SubclassClass;
  namePreface?: string;
  description?: string;
  levels: SubclassLevel[];
  visibility: SubclassVisibility;
  discordId: string;
}

export const createSubclass = async (
  input: CreateSubclassInput
): Promise<Subclass> => {
  const {
    name,
    className,
    namePreface,
    description,
    levels,
    visibility,
    discordId,
  } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdSubclass = await prisma.subclass.create({
    data: {
      name,
      className,
      namePreface,
      description,
      visibility,
      creator: {
        connect: { id: user.id },
      },
      abilities: {
        create: levels.flatMap((level) =>
          level.abilities.map((ability, index) => ({
            level: level.level,
            name: ability.name,
            description: ability.description,
            orderIndex: index,
          }))
        ),
      },
    },
    include: {
      creator: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
    },
  });

  return toSubclass(createdSubclass);
};

export interface UpdateSubclassInput {
  id: string;
  name: string;
  className: SubclassClass;
  namePreface?: string;
  description?: string;
  levels: SubclassLevel[];
  visibility: SubclassVisibility;
  discordId: string;
}

export const updateSubclass = async (
  input: UpdateSubclassInput
): Promise<Subclass> => {
  const {
    id,
    name,
    className,
    namePreface,
    description,
    levels,
    visibility,
    discordId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid subclass ID");
  }

  const updatedSubclass = await prisma.subclass.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      className,
      namePreface,
      description,
      visibility,
      abilities: {
        deleteMany: {},
        create: levels.flatMap((level) =>
          level.abilities.map((ability, index) => ({
            level: level.level,
            name: ability.name,
            description: ability.description,
            orderIndex: index,
          }))
        ),
      },
    },
    include: {
      creator: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
    },
  });

  return toSubclass(updatedSubclass);
};

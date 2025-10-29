import type {
  ArmorType,
  Class,
  ClassLevel,
  ClassMini,
  ClassVisibility,
  HitDieSize,
  StatType,
  WeaponSpec,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toCharacterClass, toClassMini } from "./converters";
import { prisma } from "./index";

export const deleteClass = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const classEntity = await prisma.class.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!classEntity;
};

export const listPublicClasses = async (): Promise<Class[]> => {
  return (
    await prisma.class.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: {
        creator: true,
        source: true,
        abilities: {
          orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
        },
        classAbilityListLinks: {
          orderBy: { orderIndex: "asc" },
          include: {
            abilityList: {
              include: {
                creator: true,
                items: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
        classAwards: { include: { award: true } },
      },
    })
  ).map(toCharacterClass);
};

export const findClass = async (id: string): Promise<Class | null> => {
  const classEntity = await prisma.class.findUnique({
    where: { id },
    include: {
      creator: true,
      source: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
      classAbilityListLinks: {
        orderBy: { orderIndex: "asc" },
        include: {
          abilityList: {
            include: {
              creator: true,
              items: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
      classAwards: { include: { award: true } },
    },
  });
  return classEntity ? toCharacterClass(classEntity) : null;
};

export const findPublicClassById = async (
  id: string
): Promise<Class | null> => {
  const classEntity = await prisma.class.findUnique({
    where: { id, visibility: "public" },
    include: {
      creator: true,
      source: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
      classAbilityListLinks: {
        orderBy: { orderIndex: "asc" },
        include: {
          abilityList: {
            include: {
              creator: true,
              items: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
      classAwards: { include: { award: true } },
    },
  });
  return classEntity ? toCharacterClass(classEntity) : null;
};

export const findClassWithCreatorDiscordId = async (
  id: string,
  creatorDiscordId: string
): Promise<Class | null> => {
  const classEntity = await prisma.class.findUnique({
    where: { id, creator: { discordId: creatorDiscordId } },
    include: {
      creator: true,
      source: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
      classAbilityListLinks: {
        orderBy: { orderIndex: "asc" },
        include: {
          abilityList: {
            include: {
              creator: true,
              items: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
      classAwards: { include: { award: true } },
    },
  });
  return classEntity ? toCharacterClass(classEntity) : null;
};

export const listPublicClassesForUser = async (
  userId: string
): Promise<Class[]> => {
  return (
    await prisma.class.findMany({
      include: {
        creator: true,
        source: true,
        abilities: {
          orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
        },
        classAbilityListLinks: {
          orderBy: { orderIndex: "asc" },
          include: {
            abilityList: {
              include: {
                creator: true,
                items: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
        classAwards: { include: { award: true } },
      },
      where: {
        userId,
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toCharacterClass);
};

export const listAllClassesForDiscordID = async (
  discordId: string
): Promise<Class[]> => {
  return (
    await prisma.class.findMany({
      include: {
        creator: true,
        source: true,
        abilities: {
          orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
        },
        classAbilityListLinks: {
          orderBy: { orderIndex: "asc" },
          include: {
            abilityList: {
              include: {
                creator: true,
                items: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
        classAwards: { include: { award: true } },
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toCharacterClass);
};

export interface SearchClassesParams {
  searchTerm?: string;
  creatorId?: string;
  sortBy?: "name";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicClassMinis = async ({
  searchTerm,
  creatorId: discordId,
  sortDirection = "asc",
  limit = 500,
}: SearchClassesParams): Promise<ClassMini[]> => {
  const whereClause: {
    creator?: { discordId?: string };
    visibility: "public";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
    }>;
  } = {
    visibility: "public",
  };

  if (discordId) {
    whereClause.creator = { discordId: discordId };
  }

  if (searchTerm) {
    whereClause.OR = [{ name: { contains: searchTerm, mode: "insensitive" } }];
  }

  const orderBy: { name: "asc" | "desc" } = { name: sortDirection };

  return (
    await prisma.class.findMany({
      where: whereClause,
      orderBy,
      take: limit,
    })
  ).map(toClassMini);
};

export interface CreateClassInput {
  name: string;
  description: string;
  keyStats: StatType[];
  hitDie: HitDieSize;
  startingHp: number;
  saves: Record<StatType, number>;
  armor: ArmorType[];
  weapons: WeaponSpec;
  startingGear: string[];
  levels: ClassLevel[];
  abilityListIds: string[];
  visibility: ClassVisibility;
  discordId: string;
}

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  const {
    name,
    description,
    keyStats,
    hitDie,
    startingHp,
    saves,
    armor,
    weapons,
    startingGear,
    levels,
    abilityListIds,
    visibility,
    discordId,
  } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdClass = await prisma.class.create({
    data: {
      name,
      description,
      keyStats,
      hitDie,
      startingHp,
      saves: saves as never,
      armor,
      weapons: weapons as never,
      startingGear,
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
      classAbilityListLinks: {
        create: abilityListIds.map((listId, index) => ({
          abilityListId: listId,
          orderIndex: index,
        })),
      },
    },
    include: {
      creator: true,
      source: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
      classAbilityListLinks: {
        orderBy: { orderIndex: "asc" },
        include: {
          abilityList: {
            include: {
              creator: true,
              items: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
      classAwards: { include: { award: true } },
    },
  });

  return toCharacterClass(
    createdClass as Parameters<typeof toCharacterClass>[0]
  );
};

export interface UpdateClassInput {
  id: string;
  name: string;
  description: string;
  keyStats: StatType[];
  hitDie: HitDieSize;
  startingHp: number;
  saves: Record<StatType, number>;
  armor: ArmorType[];
  weapons: WeaponSpec;
  startingGear: string[];
  levels: ClassLevel[];
  abilityListIds: string[];
  visibility: ClassVisibility;
  discordId: string;
}

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  const {
    id,
    name,
    description,
    keyStats,
    hitDie,
    startingHp,
    saves,
    armor,
    weapons,
    startingGear,
    levels,
    abilityListIds,
    visibility,
    discordId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid class ID");
  }

  const updatedClass = await prisma.class.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      description,
      keyStats,
      hitDie,
      startingHp,
      saves: saves as never,
      armor,
      weapons: weapons as never,
      startingGear,
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
      classAbilityListLinks: {
        deleteMany: {},
        create: abilityListIds.map((listId, index) => ({
          abilityListId: listId,
          orderIndex: index,
        })),
      },
    },
    include: {
      creator: true,
      source: true,
      abilities: {
        orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
      },
      classAbilityListLinks: {
        orderBy: { orderIndex: "asc" },
        include: {
          abilityList: {
            include: {
              creator: true,
              items: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
      classAwards: { include: { award: true } },
    },
  });

  return toCharacterClass(
    updatedClass as Parameters<typeof toCharacterClass>[0]
  );
};

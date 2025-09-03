import {
  invalidateEntityImageCache,
  preloadImage,
} from "@/lib/cache/image-cache";
import type { Ability, Action, Companion, MonsterSize } from "@/lib/types";
import { getBaseUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import type { InputJsonValue } from "../prisma/runtime/library";
import { toCompanion } from "./converters";
import { prisma } from "./index";

export const deleteCompanion = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const companion = await prisma.companion.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!companion;
};

export const listPublicCompanions = async (): Promise<Companion[]> => {
  return (
    await prisma.companion.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: {
        creator: true,
      },
    })
  ).map(toCompanion);
};

export const findCompanion = async (id: string): Promise<Companion | null> => {
  if (!isValidUUID(id)) return null;

  const companion = await prisma.companion.findUnique({
    where: { id },
    include: {
      creator: true,
    },
  });
  return companion ? toCompanion(companion) : null;
};

export const findPublicCompanionById = async (
  id: string
): Promise<Companion | null> => {
  if (!isValidUUID(id)) return null;

  const companion = await prisma.companion.findUnique({
    where: { id, visibility: "public" },
    include: {
      creator: true,
    },
  });
  return companion ? toCompanion(companion) : null;
};

export const findCompanionWithCreatorDiscordId = async (
  id: string,
  creatorId: string
): Promise<Companion | null> => {
  if (!isValidUUID(id)) return null;

  const companion = await prisma.companion.findUnique({
    where: { id, creator: { discordId: creatorId } },
    include: {
      creator: true,
    },
  });
  return companion ? toCompanion(companion) : null;
};

export const listPublicCompanionsForDiscordID = async (
  username: string
): Promise<Companion[]> => {
  return (
    await prisma.companion.findMany({
      include: {
        creator: true,
      },
      where: {
        creator: { username },
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toCompanion);
};

export const listAllCompanionsForDiscordID = async (
  id: string
): Promise<Companion[]> => {
  return (
    await prisma.companion.findMany({
      include: {
        creator: true,
      },
      where: { creator: { discordId: id } },
      orderBy: { name: "asc" },
    })
  ).map(toCompanion);
};

export interface CreateCompanionInput {
  name: string;
  kind: string;
  class: string;
  hp_per_level: string;
  wounds: number;
  size: MonsterSize;
  saves: string;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  dyingRule: string;
  moreInfo?: string;
  visibility: "public" | "private";
  discordId: string;
}

export const createCompanion = async (
  input: CreateCompanionInput
): Promise<Companion> => {
  const {
    name,
    kind,
    class: companionClass,
    hp_per_level,
    wounds,
    size,
    saves,
    actions,
    abilities,
    actionPreface,
    dyingRule,
    moreInfo = "",
    visibility,
    discordId,
  } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdCompanion = await prisma.companion.create({
    data: {
      name,
      kind,
      class: companionClass,
      hp_per_level,
      wounds,
      size,
      saves,
      actions: actions as unknown as InputJsonValue[],
      abilities: abilities as unknown as InputJsonValue[],
      actionPreface,
      dyingRule,
      moreInfo,
      visibility,
      creator: {
        connect: { id: user.id },
      },
    },
    include: {
      creator: true,
    },
  });

  const companion = toCompanion(createdCompanion);

  // Trigger async image pre-generation (non-blocking)
  preloadImage("companion", companion.id, getBaseUrl()).catch(() => {});

  return companion;
};

export interface UpdateCompanionInput {
  id: string;
  name: string;
  kind: string;
  class: string;
  hp_per_level: string;
  wounds: number;
  size: MonsterSize;
  saves: string;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  dyingRule: string;
  moreInfo: string;
  visibility: "public" | "private";
  discordId: string;
}

export const updateCompanion = async (
  input: UpdateCompanionInput
): Promise<Companion> => {
  const {
    id,
    name,
    kind,
    class: companionClass,
    hp_per_level,
    wounds,
    size,
    saves,
    actions,
    abilities,
    actionPreface,
    dyingRule,
    moreInfo,
    visibility,
    discordId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid companion ID");
  }

  const updatedCompanion = await prisma.companion.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      kind,
      class: companionClass,
      hp_per_level,
      wounds,
      size,
      saves,
      actions: actions as unknown as InputJsonValue[],
      abilities: abilities as unknown as InputJsonValue[],
      actionPreface,
      dyingRule,
      moreInfo,
      visibility,
      updatedAt: new Date(),
    },
    include: {
      creator: true,
    },
  });

  const companion = toCompanion(updatedCompanion);

  // Invalidate old cached image and trigger async pre-generation
  invalidateEntityImageCache("companion", companion.id);
  preloadImage("companion", companion.id, getBaseUrl()).catch(() => {});

  return companion;
};

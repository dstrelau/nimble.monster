"use server";
import { toUser } from "@/lib/db/converters";
import { prisma } from "@/lib/db/prisma";
import { isValidUUID } from "@/lib/utils/validation";
import { toItem, toItemMini } from "./converters";
import type {
  CreateItemInput,
  Item,
  ItemMini,
  ItemRarity,
  SearchItemsParams,
  UpdateItemInput,
} from "./types";

export const deleteItem = async (
  id: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const item = await prisma.item.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!item;
};

export const listPublicItems = async (): Promise<ItemMini[]> => {
  return (
    await prisma.item.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
    })
  ).map(toItemMini);
};

export const getRandomRecentItems = async (
  limit: number = 3
): Promise<Item[]> => {
  const items = (
    await prisma.item.findMany({
      where: { visibility: "public" },
      orderBy: { createdAt: "desc" },
      take: limit * 3,
      include: {
        creator: true,
        source: true,
      },
    })
  ).map(toItem);

  const shuffled = items.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const findItem = async (id: string): Promise<Item | null> => {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      creator: true,
      source: true,
    },
  });
  return item ? toItem(item) : null;
};

export const findItemCollections = async (itemId: string) => {
  if (!isValidUUID(itemId)) return [];

  const collections = await prisma.collection.findMany({
    where: {
      itemCollections: {
        some: { itemId },
      },
      visibility: "public",
    },
    include: {
      creator: true,
    },
    orderBy: { name: "asc" },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    creator: toUser(collection.creator),
  }));
};

export const findPublicItemById = async (id: string): Promise<Item | null> => {
  const item = await prisma.item.findUnique({
    where: { id, visibility: "public" },
    include: {
      creator: true,
      source: true,
    },
  });
  return item ? toItem(item) : null;
};

export const findItemWithCreatorDiscordId = async (
  id: string,
  creatorId: string
): Promise<Item | null> => {
  const item = await prisma.item.findUnique({
    where: { id, creator: { id: creatorId } },
    include: {
      creator: true,
      source: true,
    },
  });
  return item ? toItem(item) : null;
};

export const listPublicItemsForUser = async (
  userId: string
): Promise<Item[]> => {
  return (
    await prisma.item.findMany({
      include: {
        creator: true,
        source: true,
      },
      where: {
        userId,
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toItem);
};

export const listAllItemsForDiscordID = async (
  discordId: string
): Promise<Item[]> => {
  return (
    await prisma.item.findMany({
      include: {
        creator: true,
        source: true,
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toItem);
};

export const searchPublicItems = async ({
  searchTerm,
  rarity,
  sourceId,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchItemsParams & { offset?: number }): Promise<Item[]> => {
  const whereClause: {
    creator?: { discordId?: string };
    visibility: "public";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      kind?: { contains: string; mode: "insensitive" };
    }>;
    rarity?: ItemRarity;
    sourceId?: string;
  } = {
    visibility: "public",
  };

  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { kind: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (rarity && rarity !== "all") {
    whereClause.rarity = rarity;
  }

  if (sourceId) {
    whereClause.sourceId = sourceId;
  }

  let orderBy: { name: "asc" | "desc" } | { createdAt: "asc" | "desc" } = {
    createdAt: sortDirection,
  };

  if (sortBy === "name") {
    orderBy = { name: sortDirection };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortDirection };
  }

  return (
    await prisma.item.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        creator: true,
        source: true,
      },
    })
  ).map(toItem);
};

export const createItem = async (
  input: CreateItemInput,
  discordId: string
): Promise<Item> => {
  const {
    name,
    kind = "",
    description,
    moreInfo = "",
    imageIcon,
    imageBgIcon,
    imageColor,
    imageBgColor,
    rarity,
    visibility,
    sourceId,
  } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdItem = await prisma.item.create({
    data: {
      name,
      kind,
      description,
      moreInfo,
      imageIcon,
      imageBgIcon,
      imageColor,
      imageBgColor,
      rarity,
      visibility,
      creator: {
        connect: { id: user.id },
      },
      ...(sourceId && { source: { connect: { id: sourceId } } }),
    },
    include: {
      creator: true,
      source: true,
    },
  });

  const item = toItem(createdItem);

  return item;
};

export const updateItem = async (
  id: string,
  input: UpdateItemInput,
  discordId: string
): Promise<Item> => {
  const {
    name,
    kind = "",
    description,
    moreInfo = "",
    imageIcon,
    imageBgIcon,
    imageColor,
    imageBgColor,
    rarity,
    visibility,
    sourceId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid item ID");
  }

  const updatedItem = await prisma.item.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      kind,
      description,
      moreInfo,
      imageIcon,
      imageBgIcon,
      imageColor,
      imageBgColor,
      rarity,
      visibility,
      source: sourceId ? { connect: { id: sourceId } } : { disconnect: true },
    },
    include: {
      creator: true,
      source: true,
    },
  });

  return toItem(updatedItem);
};

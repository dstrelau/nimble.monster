import type { Item, ItemMini, ItemRarity, ItemRarityFilter } from "@/lib/types";
import { getBaseUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import { invalidateEntityImageCache, preloadImage } from "../cache/image-cache";
import { toItem, toItemMini } from "./converters";
import { prisma } from "./index";

export const deleteItem = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const item = await prisma.item.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!item;
};

export const listPublicItems = async (): Promise<Item[]> => {
  return (
    await prisma.item.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: {
        creator: true,
      },
    })
  ).map(toItem);
};

export const findItem = async (id: string): Promise<Item | null> => {
  if (!isValidUUID(id)) return null;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      creator: true,
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
    creator: {
      id: collection.creator.id,
      discordId: collection.creator.discordId,
      username: collection.creator.username,
      avatar: collection.creator.avatar || undefined,
    },
  }));
};

export const findPublicItemById = async (id: string): Promise<Item | null> => {
  if (!isValidUUID(id)) return null;

  const item = await prisma.item.findUnique({
    where: { id, visibility: "public" },
    include: {
      creator: true,
    },
  });
  return item ? toItem(item) : null;
};

export const findItemWithCreatorDiscordId = async (
  id: string,
  creatorDiscordId: string
): Promise<Item | null> => {
  if (!isValidUUID(id)) return null;

  const item = await prisma.item.findUnique({
    where: { id, creator: { discordId: creatorDiscordId } },
    include: {
      creator: true,
    },
  });
  return item ? toItem(item) : null;
};

export const listPublicItemsForDiscordID = async (
  username: string
): Promise<Item[]> => {
  return (
    await prisma.item.findMany({
      include: {
        creator: true,
      },
      where: {
        creator: { username },
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
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toItem);
};

export interface SearchItemsParams {
  searchTerm?: string;
  rarity?: ItemRarityFilter;
  creatorId?: string;
  sortBy?: "name" | "rarity";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicItemMinis = async ({
  searchTerm,
  rarity,
  creatorId: discordId,
  sortBy = "name",
  sortDirection = "asc",
  limit = 500,
}: SearchItemsParams): Promise<ItemMini[]> => {
  const whereClause: {
    creator?: { discordId?: string };
    visibility: "public";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      kind?: { contains: string; mode: "insensitive" };
    }>;
    rarity?: ItemRarity;
  } = {
    visibility: "public",
  };

  if (discordId) {
    whereClause.creator = { discordId: discordId };
  }

  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { kind: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (rarity && rarity !== "all") {
    whereClause.rarity = rarity;
  }

  let orderBy: { name: "asc" | "desc" } | { rarity: "asc" | "desc" } = {
    name: "asc",
  };

  if (sortBy === "name") {
    orderBy = { name: sortDirection };
  } else if (sortBy === "rarity") {
    orderBy = { rarity: sortDirection };
  }

  return (
    await prisma.item.findMany({
      where: whereClause,
      orderBy,
      take: limit,
    })
  ).map(toItemMini);
};

export interface CreateItemInput {
  name: string;
  kind?: string;
  description: string;
  moreInfo?: string;
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  rarity?: ItemRarity;
  visibility: "public" | "private";
  discordId: string;
}

export const createItem = async (input: CreateItemInput): Promise<Item> => {
  const {
    name,
    kind = "",
    description,
    moreInfo = "",
    imageIcon,
    imageBgIcon,
    imageColor,
    rarity,
    visibility,
    discordId,
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
      rarity,
      visibility,
      creator: {
        connect: { id: user.id },
      },
    },
    include: {
      creator: true,
    },
  });

  const item = toItem(createdItem);

  // Trigger async image pre-generation (non-blocking)
  // Silent fail - image will be generated on-demand if needed
  preloadImage("item", item.id, getBaseUrl()).catch(() => {});

  return item;
};

export interface UpdateItemInput {
  id: string;
  name: string;
  kind?: string;
  description: string;
  moreInfo?: string;
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  imageBgColor?: string;
  rarity?: ItemRarity;
  visibility: "public" | "private";
  discordId: string;
}

export const updateItem = async (input: UpdateItemInput): Promise<Item> => {
  console.log(input);
  const {
    id,
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
    discordId,
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
    },
    include: {
      creator: true,
    },
  });

  const item = toItem(updatedItem);

  // Invalidate old cached image and trigger async pre-generation
  // Silent fail - image will be generated on-demand if needed
  invalidateEntityImageCache("item", item.id);
  preloadImage("item", item.id, getBaseUrl()).catch(() => {});

  return item;
};

import type { prisma } from "@/lib/db";
import { toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import { uuidToIdentifier } from "@/lib/utils/slug";
import type { Item, ItemMini, ItemRarity } from "./types";

export const toItemMini = (
  i: Prisma.Result<typeof prisma.item, object, "findMany">[0]
): ItemMini => ({
  id: i.id,
  name: i.name,
  kind: i.kind || undefined,
  rarity: i.rarity as ItemRarity,
  visibility: i.visibility,
  imageIcon: i.imageIcon || undefined,
  imageBgIcon: i.imageBgIcon || undefined,
  imageColor: i.imageColor || undefined,
  imageBgColor: i.imageBgColor || undefined,
  createdAt: i.createdAt,
  updatedAt: i.updatedAt,
});

export const toItem = (
  i: Prisma.Result<
    typeof prisma.item,
    {
      include: {
        creator: true;
      };
    },
    "findMany"
  >[0]
): Item => {
  return {
    ...toItemMini(i),
    description: i.description,
    moreInfo: i.moreInfo || undefined,
    creator: toUser(i.creator),
  };
};

export const toJsonApiItem = (item: Item) => {
  return {
    type: "items",
    id: uuidToIdentifier(item.id),
    attributes: {
      name: item.name,
      kind: item.kind,
      rarity: item.rarity,
      description: item.description,
      moreInfo: item.moreInfo,
    },
    links: {
      self: `/api/items/${uuidToIdentifier(item.id)}`,
    },
  };
};

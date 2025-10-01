import type { prisma } from "@/lib/db";
import { toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
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
    updatedAt: i.updatedAt,
    creator: toUser(i.creator),
  };
};

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
        source: true;
        itemAwards: { include: { award: true } };
        remixedFrom: { include: { creator: true } };
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
    source: i.source || undefined,
    awards:
      i.itemAwards?.map((ia) => ({
        id: ia.award.id,
        slug: ia.award.slug,
        name: ia.award.name,
        abbreviation: ia.award.abbreviation,
        description: ia.award.description,
        url: ia.award.url,
        color: ia.award.color,
        icon: ia.award.icon,
        createdAt: ia.award.createdAt,
        updatedAt: ia.award.updatedAt,
      })) || undefined,
    remixedFromId: i.remixedFromId || null,
    remixedFrom: i.remixedFrom
      ? {
          id: i.remixedFrom.id,
          name: i.remixedFrom.name,
          creator: toUser(i.remixedFrom.creator),
        }
      : null,
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

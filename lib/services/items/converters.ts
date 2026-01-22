import { toUser } from "@/lib/db/converters";
import { uuidToIdentifier } from "@/lib/utils/slug";
import type { Item, ItemMini, ItemRarity } from "./types";

interface ItemRow {
  id: string;
  name: string;
  kind: string;
  rarity: string | null;
  visibility: string | null;
  imageIcon: string | null;
  imageBgIcon: string | null;
  imageColor: string | null;
  imageBgColor: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string;
  moreInfo: string | null;
}

interface UserRow {
  id: string;
  discordId: string | null;
  username: string | null;
  displayName: string | null;
  imageUrl: string | null;
  avatar: string | null;
}

interface AwardRow {
  id: string;
  slug: string;
  name: string;
  abbreviation: string;
  description: string | null;
  url: string;
  color: string;
  icon: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ItemWithRelations extends ItemRow {
  creator: UserRow;
  source: {
    id: string;
    name: string;
    abbreviation: string;
    license: string;
    link: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  itemAwards?: Array<{ award: AwardRow }>;
}

export const toItemMini = (i: ItemRow): ItemMini => ({
  id: i.id,
  name: i.name,
  kind: i.kind || undefined,
  rarity: (i.rarity ?? "unspecified") as ItemRarity,
  visibility: i.visibility as ItemMini["visibility"],
  imageIcon: i.imageIcon || undefined,
  imageBgIcon: i.imageBgIcon || undefined,
  imageColor: i.imageColor || undefined,
  imageBgColor: i.imageBgColor || undefined,
  createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
  updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
});

export const toItem = (i: ItemWithRelations): Item => {
  return {
    ...toItemMini(i),
    description: i.description,
    moreInfo: i.moreInfo || undefined,
    creator: toUser(i.creator),
    source: i.source
      ? {
          ...i.source,
          createdAt: i.source.createdAt
            ? new Date(i.source.createdAt)
            : new Date(),
          updatedAt: i.source.updatedAt
            ? new Date(i.source.updatedAt)
            : new Date(),
        }
      : undefined,
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
        createdAt: ia.award.createdAt
          ? new Date(ia.award.createdAt)
          : new Date(),
        updatedAt: ia.award.updatedAt
          ? new Date(ia.award.updatedAt)
          : new Date(),
      })) || undefined,
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

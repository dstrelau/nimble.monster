import { parseJsonField, toUser } from "@/lib/db/converters";
import type {
  Ancestry,
  AncestryAbility,
  AncestryMini,
  AncestryRarity,
  AncestrySize,
} from "./types";

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

interface AncestryRow {
  id: string;
  name: string;
  size: string;
  rarity: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string;
  abilities: unknown;
}

interface AncestryWithRelations extends AncestryRow {
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
  ancestryAwards?: Array<{ award: AwardRow }>;
}

export const toAncestryMini = (a: AncestryRow): AncestryMini => ({
  id: a.id,
  name: a.name,
  size: (a.size ? a.size.split(" ").filter(Boolean) : []) as AncestrySize[],
  rarity: (a.rarity ?? "common") as AncestryRarity,
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
});

export const toAncestry = (a: AncestryWithRelations): Ancestry => {
  return {
    ...toAncestryMini(a),
    description: a.description,
    abilities: parseJsonField<AncestryAbility>(a.abilities),
    creator: toUser(a.creator),
    source: a.source
      ? {
          ...a.source,
          createdAt: a.source.createdAt
            ? new Date(a.source.createdAt)
            : new Date(),
          updatedAt: a.source.updatedAt
            ? new Date(a.source.updatedAt)
            : new Date(),
        }
      : undefined,
    awards:
      a.ancestryAwards?.map((aa) => ({
        id: aa.award.id,
        slug: aa.award.slug,
        name: aa.award.name,
        abbreviation: aa.award.abbreviation,
        description: aa.award.description,
        url: aa.award.url,
        color: aa.award.color,
        icon: aa.award.icon,
        createdAt: aa.award.createdAt
          ? new Date(aa.award.createdAt)
          : new Date(),
        updatedAt: aa.award.updatedAt
          ? new Date(aa.award.updatedAt)
          : new Date(),
      })) || undefined,
  };
};

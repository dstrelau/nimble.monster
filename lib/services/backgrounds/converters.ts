import { toUser } from "@/lib/db/converters";
import type { Background, BackgroundMini } from "./types";

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

interface BackgroundRow {
  id: string;
  name: string;
  requirement: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string;
}

interface BackgroundWithRelations extends BackgroundRow {
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
  backgroundAwards?: Array<{ award: AwardRow }>;
}

export const toBackgroundMini = (b: BackgroundRow): BackgroundMini => ({
  id: b.id,
  name: b.name,
  requirement: b.requirement || undefined,
  createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
  updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
});

export const toBackground = (b: BackgroundWithRelations): Background => {
  return {
    ...toBackgroundMini(b),
    description: b.description,
    creator: toUser(b.creator),
    source: b.source
      ? {
          ...b.source,
          createdAt: b.source.createdAt
            ? new Date(b.source.createdAt)
            : new Date(),
          updatedAt: b.source.updatedAt
            ? new Date(b.source.updatedAt)
            : new Date(),
        }
      : undefined,
    awards:
      b.backgroundAwards?.map((ba) => ({
        id: ba.award.id,
        slug: ba.award.slug,
        name: ba.award.name,
        abbreviation: ba.award.abbreviation,
        description: ba.award.description,
        url: ba.award.url,
        color: ba.award.color,
        icon: ba.award.icon,
        createdAt: ba.award.createdAt
          ? new Date(ba.award.createdAt)
          : new Date(),
        updatedAt: ba.award.updatedAt
          ? new Date(ba.award.updatedAt)
          : new Date(),
      })) || undefined,
  };
};

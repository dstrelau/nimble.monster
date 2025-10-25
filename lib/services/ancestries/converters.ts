import type { prisma } from "@/lib/db";
import { toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type {
  Ancestry,
  AncestryAbility,
  AncestryMini,
  AncestryRarity,
  AncestrySize,
} from "./types";

export const toAncestryMini = (
  a: Prisma.Result<typeof prisma.ancestry, object, "findMany">[0]
): AncestryMini => ({
  id: a.id,
  name: a.name,
  size: a.size as AncestrySize[],
  rarity: a.rarity as AncestryRarity,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

export const toAncestry = (
  a: Prisma.Result<
    typeof prisma.ancestry,
    {
      include: {
        creator: true;
        source: true;
        ancestryAwards: { include: { award: true } };
      };
    },
    "findMany"
  >[0]
): Ancestry => {
  return {
    ...toAncestryMini(a),
    description: a.description,
    abilities: a.abilities as unknown as AncestryAbility[],
    creator: toUser(a.creator),
    source: a.source || undefined,
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
        createdAt: aa.award.createdAt,
        updatedAt: aa.award.updatedAt,
      })) || undefined,
  };
};

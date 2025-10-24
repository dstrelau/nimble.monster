import type { prisma } from "@/lib/db";
import { toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type { Background, BackgroundMini } from "./types";

export const toBackgroundMini = (
  b: Prisma.Result<typeof prisma.background, object, "findMany">[0]
): BackgroundMini => ({
  id: b.id,
  name: b.name,
  requirement: b.requirement || undefined,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const toBackground = (
  b: Prisma.Result<
    typeof prisma.background,
    {
      include: {
        creator: true;
        source: true;
        backgroundAwards: { include: { award: true } };
      };
    },
    "findMany"
  >[0]
): Background => {
  return {
    ...toBackgroundMini(b),
    description: b.description,
    creator: toUser(b.creator),
    source: b.source || undefined,
    awards:
      b.backgroundAwards?.map((ba) => ({
        id: ba.award.id,
        name: ba.award.name,
        abbreviation: ba.award.abbreviation,
        url: ba.award.url,
        color: ba.award.color,
        icon: ba.award.icon,
        createdAt: ba.award.createdAt,
        updatedAt: ba.award.updatedAt,
      })) || undefined,
  };
};

import type { Prisma } from "@/lib/prisma";
import type {
  Ability,
  Action,
  CollectionOverview,
  Family,
  Monster,
} from "@/lib/types";
import type { prisma } from "./index";

export const toMonster = (
  m: Prisma.Result<
    typeof prisma.monster,
    {
      include: {
        family: true;
        creator: true;
      };
    },
    "findMany"
  >[0]
): Monster => ({
  ...m,
  saves: m.saves.join(" "),
  armor: m.armor === "EMPTY_ENUM_VALUE" ? "none" : m.armor,
  abilities: m.abilities as unknown as Ability[],
  actions: m.actions as unknown as Action[],
  actionPreface: m.actionPreface || "",
  moreInfo: m.moreInfo || "",
  family: toFamily(m.family),
  creator: { ...m.creator, avatar: m.creator.avatar || "" },
});

export const toFamily = (
  f: Prisma.Result<typeof prisma.family, object, "findMany">[0] | null
): Family | undefined => {
  if (!f) {
    return undefined;
  }
  return {
    ...f,
    description: f.description ?? undefined,
    abilities: f.abilities as unknown as Ability[],
  };
};

export const toCollectionOverview = (
  c: Prisma.Result<
    typeof prisma.collection,
    {
      include: {
        creator: true;
        monsterCollections: {
          include: {
            monster: {
              include: {
                creator: true;
                family: true;
              };
            };
          };
        };
      };
    },
    "findMany"
  >[0]
): CollectionOverview => {
  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary
  ).length;
  return {
    ...c,
    visibility: c.visibility === "private" ? "private" : "public",
    legendaryCount,
    standardCount: c.monsterCollections.length - legendaryCount,
    creator: { ...c.creator, avatar: c.creator.avatar || "" },
    monsters: c.monsterCollections.map((mc) => toMonster(mc.monster)),
  };
};

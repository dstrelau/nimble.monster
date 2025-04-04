import { PrismaClient } from "@/lib/prisma";
import * as Prisma from "@/lib/prisma";
import {
  Ability,
  Action,
  Collection,
  CollectionOverview,
  Monster,
} from "@/lib/types";

const prisma = new PrismaClient();

const toMonster = (m: Prisma.Monster): Monster => ({
  ...m,
  saves: m.saves.join(" "),
  armor: m.armor === "EMPTY_ENUM_VALUE" ? "" : m.armor,
  abilities: m.abilities as unknown as Ability[],
  actions: m.actions as unknown as Action[],
  actionPreface: m.actionPreface || "",
  moreInfo: m.moreInfo || "",
});

export const listPublicMonsters = async (): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export const listPublicCollections = async (): Promise<
  CollectionOverview[]
> => {
  return (
    await prisma.collection.findMany({
      include: {
        creator: true,
        monsterCollections: { include: { monster: true } },
      },
    })
  ).map((c): CollectionOverview => {
    const legendaryCount = c.monsterCollections.filter(
      (m) => m.monster.legendary,
    ).length;
    return {
      ...c,
      legendaryCount,
      standardCount: c.monsterCollections.length - legendaryCount,
      creator: { ...c.creator, avatar: c.creator.avatar || "" },
    };
  });
};

export const getCollection = async (id: string): Promise<Collection | null> => {
  const c = await prisma.collection.findUnique({
    where: { id: id },
    include: {
      creator: true,
      monsterCollections: { include: { monster: true } },
    },
  });
  if (!c) return c;

  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary,
  ).length;
  return {
    ...c,
    legendaryCount: legendaryCount,
    standardCount: c.monsterCollections.length - legendaryCount,
    creator: { ...c.creator, avatar: c.creator.avatar || "" },
    monsters: c.monsterCollections.flatMap((mc) => toMonster(mc.monster)),
  };
};

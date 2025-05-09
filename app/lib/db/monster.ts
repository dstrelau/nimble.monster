import { Monster } from "@/lib/types";
import { prisma } from "./index";
import { toMonster } from "./converters";

export const deleteMonster = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  const monster = await prisma.monster.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!monster;
};

export const listPublicMonsters = async (): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: { family: true, creator: true },
    })
  ).map(toMonster);
};

export const findPublicMonsterById = async (
  id: string,
): Promise<Monster | null> => {
  const monster = await prisma.monster.findUnique({
    where: { id },
    include: { family: true, creator: true },
  });
  return monster ? toMonster(monster) : null;
};

export const listPublicMonstersForDiscordID = async (
  username: string,
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: { family: true, creator: true },
      where: {
        creator: { username },
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export const listAllMonstersForDiscordID = async (
  id: string,
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: { family: true, creator: true },
      where: { creator: { discordId: id } },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

import { prisma } from "./index";

export async function listOfficialConditions() {
  return await prisma.condition.findMany({
    where: {
      official: true,
    },
  });
}

export async function listConditionsForMonster(monsterId: string) {
  return await prisma.monsterCondition.findMany({
    where: {
      monsterId,
    },
    include: {
      condition: true,
    },
  });
}

export async function listConditionsForDiscordId(discordId: string) {
  return await prisma.condition.findMany({
    where: {
      creator: { discordId },
    },
  });
}

export async function createCondition(
  discordId: string,
  name: string,
  description: string
) {
  return await prisma.condition.create({
    data: {
      creator: { connect: { discordId } },
      name,
      description,
    },
  });
}

export async function deleteCondition(conditionId: string, discordId: string) {
  return await prisma.condition.delete({
    where: {
      id: conditionId,
      creator: { discordId },
    },
  });
}

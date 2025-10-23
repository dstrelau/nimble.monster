import { prisma } from "./index";

export async function getAllAwards() {
  return prisma.award.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getAwardById(id: string) {
  return prisma.award.findUnique({
    where: { id },
  });
}

export async function createAward(data: {
  name: string;
  abbreviation: string;
  url: string;
  color: string;
  icon: string;
}) {
  return prisma.award.create({
    data,
  });
}

export async function updateAward(
  id: string,
  data: {
    name: string;
    abbreviation: string;
    url: string;
    color: string;
    icon: string;
  }
) {
  return prisma.award.update({
    where: { id },
    data,
  });
}

export async function deleteAward(id: string) {
  return prisma.award.delete({
    where: { id },
  });
}

export async function getAwardsWithCounts() {
  const awards = await prisma.award.findMany({
    include: {
      monsterAwards: true,
      itemAwards: true,
      companionAwards: true,
      subclassAwards: true,
      schoolAwards: true,
    },
    orderBy: { name: "asc" },
  });

  return awards.map((award) => ({
    ...award,
    monsterCount: award.monsterAwards.length,
    itemCount: award.itemAwards.length,
    companionCount: award.companionAwards.length,
    subclassCount: award.subclassAwards.length,
    schoolCount: award.schoolAwards.length,
  }));
}

export async function getEntitiesWithAwards() {
  const [monsters, items, companions, subclasses, schools] = await Promise.all([
    prisma.monster.findMany({
      where: { monsterAwards: { some: {} } },
      include: {
        monsterAwards: {
          include: { award: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { itemAwards: { some: {} } },
      include: {
        itemAwards: {
          include: { award: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.companion.findMany({
      where: { companionAwards: { some: {} } },
      include: {
        companionAwards: {
          include: { award: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.subclass.findMany({
      where: { subclassAwards: { some: {} } },
      include: {
        subclassAwards: {
          include: { award: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.spellSchool.findMany({
      where: { schoolAwards: { some: {} } },
      include: {
        schoolAwards: {
          include: { award: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return { monsters, items, companions, subclasses, schools };
}

export async function addAwardToMonster(monsterId: string, awardId: string) {
  return prisma.monsterAward.create({
    data: { monsterId, awardId },
  });
}

export async function removeAwardFromMonster(
  monsterId: string,
  awardId: string
) {
  return prisma.monsterAward.delete({
    where: { monsterId_awardId: { monsterId, awardId } },
  });
}

export async function addAwardToItem(itemId: string, awardId: string) {
  return prisma.itemAward.create({
    data: { itemId, awardId },
  });
}

export async function removeAwardFromItem(itemId: string, awardId: string) {
  return prisma.itemAward.delete({
    where: { itemId_awardId: { itemId, awardId } },
  });
}

export async function addAwardToCompanion(
  companionId: string,
  awardId: string
) {
  return prisma.companionAward.create({
    data: { companionId, awardId },
  });
}

export async function removeAwardFromCompanion(
  companionId: string,
  awardId: string
) {
  return prisma.companionAward.delete({
    where: { companionId_awardId: { companionId, awardId } },
  });
}

export async function addAwardToSubclass(subclassId: string, awardId: string) {
  return prisma.subclassAward.create({
    data: { subclassId, awardId },
  });
}

export async function removeAwardFromSubclass(
  subclassId: string,
  awardId: string
) {
  return prisma.subclassAward.delete({
    where: { subclassId_awardId: { subclassId, awardId } },
  });
}

export async function addAwardToSchool(schoolId: string, awardId: string) {
  return prisma.spellSchoolAward.create({
    data: { schoolId, awardId },
  });
}

export async function removeAwardFromSchool(schoolId: string, awardId: string) {
  return prisma.spellSchoolAward.delete({
    where: { schoolId_awardId: { schoolId, awardId } },
  });
}

export async function searchEntities(entityType: string, query: string) {
  const searchQuery = {
    name: { contains: query, mode: "insensitive" as const },
  };

  switch (entityType) {
    case "monster":
      return prisma.monster.findMany({
        where: searchQuery,
        select: { id: true, name: true },
        take: 10,
      });
    case "item":
      return prisma.item.findMany({
        where: searchQuery,
        select: { id: true, name: true },
        take: 10,
      });
    case "companion":
      return prisma.companion.findMany({
        where: searchQuery,
        select: { id: true, name: true },
        take: 10,
      });
    case "subclass":
      return prisma.subclass.findMany({
        where: searchQuery,
        select: { id: true, name: true },
        take: 10,
      });
    case "school":
      return prisma.spellSchool.findMany({
        where: searchQuery,
        select: { id: true, name: true },
        take: 10,
      });
    default:
      return [];
  }
}

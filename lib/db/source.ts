import { prisma } from "./index";

export async function getAllSources() {
  return prisma.source.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createSource(data: {
  name: string;
  abbreviation: string;
  license: string;
  link: string;
}) {
  return prisma.source.create({
    data,
  });
}

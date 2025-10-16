import type { Source } from "@/lib/types";
import { prisma } from "./index";

export const listAllSources = async (): Promise<Source[]> => {
  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
  });

  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
};

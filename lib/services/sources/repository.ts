"use server";
import { prisma } from "@/lib/db/prisma";
import type { SourceOption } from "./types";

export const listAllSources = async (): Promise<SourceOption[]> => {
  const sources = await prisma.source.findMany({
    select: {
      id: true,
      name: true,
      abbreviation: true,
    },
    orderBy: { name: "asc" },
  });

  return sources;
};

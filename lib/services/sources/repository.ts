"use server";
import { asc } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { sources } from "@/lib/db/schema";
import type { SourceOption } from "./types";

export const listAllSources = async (): Promise<SourceOption[]> => {
  const db = await getDatabase();
  const result = await db
    .select({
      id: sources.id,
      name: sources.name,
      abbreviation: sources.abbreviation,
    })
    .from(sources)
    .orderBy(asc(sources.name));

  return result;
};

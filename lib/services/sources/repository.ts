"use server";
import { asc, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  ancestries,
  backgrounds,
  monsters,
  sources,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";
import type { EntityType, SourceOption } from "./types";

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

const entityTables = {
  monsters,
  ancestries,
  backgrounds,
  subclasses,
  spell_schools: spellSchools,
} as const;

export const listSourcesForEntityType = async (
  entityType: EntityType
): Promise<SourceOption[]> => {
  const db = await getDatabase();
  const table = entityTables[entityType];

  const result = await db
    .select({
      id: sources.id,
      name: sources.name,
      abbreviation: sources.abbreviation,
    })
    .from(sources)
    .where(
      sql`EXISTS (SELECT 1 FROM ${table} WHERE ${eq(table.sourceId, sources.id)})`
    )
    .orderBy(asc(sources.name));

  return result;
};

import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getClient } from "./client";
import * as relations from "./relations";
import * as schema from "./schema";

const fullSchema = { ...schema, ...relations };

export type Database = LibSQLDatabase<typeof fullSchema>;

let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (dbInstance) {
    return dbInstance;
  }

  const client = getClient();
  dbInstance = drizzle(client, { schema: fullSchema });
  return dbInstance;
}

export { schema };

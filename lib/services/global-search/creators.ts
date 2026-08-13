import { count, desc, eq } from "drizzle-orm";
import { toUser } from "@/lib/db/converters";
import { getDatabase } from "@/lib/db/drizzle";
import { globalSearchCatalog, users } from "@/lib/db/schema";
import type { User } from "@/lib/types";

export async function topGlobalSearchCreators(limit = 10): Promise<User[]> {
  const db = getDatabase();
  const results = await db
    .select({ user: users, resultCount: count(globalSearchCatalog.id) })
    .from(users)
    .innerJoin(globalSearchCatalog, eq(globalSearchCatalog.creatorId, users.id))
    .where(eq(globalSearchCatalog.visibility, "public"))
    .groupBy(users.id)
    .orderBy(desc(count(globalSearchCatalog.id)), users.displayName)
    .limit(limit);

  return results.map(({ user }) => toUser(user));
}

import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import type { User } from "@/lib/types";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import { items, monsters, users } from "./schema";

export const getUserByUsername = async (
  username: string
): Promise<User | null> => {
  const db = getDatabase();

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const user = result[0];
  if (!user) return null;
  return toUser(user);
};

export const getUserPublicMonstersCount = async (
  username: string
): Promise<number> => {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userResult.length === 0) return 0;

  const result = await db
    .select({ count: count() })
    .from(monsters)
    .where(
      and(
        eq(monsters.userId, userResult[0].id),
        eq(monsters.visibility, "public")
      )
    );

  return result[0]?.count || 0;
};

export const searchUsers = async (
  query: string,
  limit = 20
): Promise<User[]> => {
  const db = getDatabase();
  const results = await db
    .select()
    .from(users)
    .where(
      or(
        like(users.displayName, `%${query}%`),
        like(users.username, `%${query}%`)
      )
    )
    .orderBy(asc(users.displayName))
    .limit(limit);
  return results.map(toUser);
};

export const topMonsterCreators = async (limit = 10): Promise<User[]> => {
  const db = getDatabase();
  const results = await db
    .select({ user: users, count: count(monsters.id) })
    .from(users)
    .innerJoin(
      monsters,
      and(eq(monsters.userId, users.id), eq(monsters.visibility, "public"))
    )
    .groupBy(users.id)
    .orderBy(desc(count(monsters.id)))
    .limit(limit);
  return results.map((r) => toUser(r.user));
};

export const topItemCreators = async (limit = 10): Promise<User[]> => {
  const db = getDatabase();
  const results = await db
    .select({ user: users, count: count(items.id) })
    .from(users)
    .innerJoin(
      items,
      and(eq(items.userId, users.id), eq(items.visibility, "public"))
    )
    .groupBy(users.id)
    .orderBy(desc(count(items.id)))
    .limit(limit);
  return results.map((r) => toUser(r.user));
};

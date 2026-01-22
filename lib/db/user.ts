import { and, count, eq } from "drizzle-orm";
import type { User } from "@/lib/types";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import { monsters, users } from "./schema";

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

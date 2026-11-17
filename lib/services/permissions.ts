import { and, asc, eq } from "drizzle-orm";
import { toUser } from "@/lib/db/converters";
import { getDatabase } from "@/lib/db/drizzle";
import { userPermissions, users } from "@/lib/db/schema";
import type { User } from "@/lib/types";

/** Admin-granted abilities. Unknown or missing permissions are not granted. */
export const PERMISSIONS = ["monstery-monday"] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "monstery-monday":
    "Can mark their own collections as part of Monstery Monday when creating or editing them.",
};

function isPermission(value: string): value is Permission {
  return PERMISSIONS.some((permission) => permission === value);
}

export async function hasPermission(
  userId: string | undefined,
  permission: Permission
): Promise<boolean> {
  if (!userId) return false;
  const [row] = await getDatabase()
    .select({ userId: userPermissions.userId })
    .from(userPermissions)
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permission, permission)
      )
    )
    .limit(1);
  return !!row;
}

export async function getPermissionUsers(): Promise<
  Record<Permission, User[]>
> {
  const rows = await getDatabase()
    .select({ permission: userPermissions.permission, user: users })
    .from(userPermissions)
    .innerJoin(users, eq(users.id, userPermissions.userId))
    .orderBy(asc(users.displayName));

  const byPermission: Record<Permission, User[]> = { "monstery-monday": [] };
  for (const { permission, user } of rows) {
    if (isPermission(permission)) byPermission[permission].push(toUser(user));
  }
  return byPermission;
}

export async function setPermission(
  userId: string,
  permission: Permission,
  granted: boolean
): Promise<void> {
  const db = getDatabase();
  if (granted) {
    await db
      .insert(userPermissions)
      .values({ userId, permission })
      .onConflictDoNothing();
  } else {
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        )
      );
  }
}

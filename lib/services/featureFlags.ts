import { and, asc, eq, sql } from "drizzle-orm";
import { toUser } from "@/lib/db/converters";
import { getDatabase } from "@/lib/db/drizzle";
import { userFeatureFlags, users } from "@/lib/db/schema";
import type { User } from "@/lib/types";

export type FeatureFlag =
  | "class-draft-autosave"
  | "monster-statblock-editor"
  | "monster-custom-artwork"
  | "monster-card-layout"
  | "field-guide";

export const FEATURE_FLAGS: readonly FeatureFlag[] = [
  "class-draft-autosave",
  "monster-statblock-editor",
  "monster-custom-artwork",
  "monster-card-layout",
  "field-guide",
];

export function isFeatureFlag(value: string): value is FeatureFlag {
  return FEATURE_FLAGS.some((feature) => feature === value);
}

export async function getEnabledFeatureFlags(
  userId: string | undefined
): Promise<FeatureFlag[]> {
  if (!userId) return [];

  const db = getDatabase();
  const rows = await db
    .select({ feature: userFeatureFlags.feature })
    .from(userFeatureFlags)
    .where(
      and(
        eq(userFeatureFlags.userId, userId),
        eq(userFeatureFlags.enabled, true)
      )
    );

  return rows
    .map(({ feature }) => feature)
    .filter((feature) => isFeatureFlag(feature));
}

export async function getFeatureFlagUsers(): Promise<
  Record<FeatureFlag, User[]>
> {
  const db = getDatabase();
  const rows = await db
    .select({ feature: userFeatureFlags.feature, user: users })
    .from(userFeatureFlags)
    .innerJoin(users, eq(users.id, userFeatureFlags.userId))
    .where(eq(userFeatureFlags.enabled, true))
    .orderBy(asc(users.displayName));

  const byFlag: Record<FeatureFlag, User[]> = {
    "class-draft-autosave": [],
    "monster-statblock-editor": [],
    "monster-custom-artwork": [],
    "monster-card-layout": [],
    "field-guide": [],
  };
  for (const { feature, user } of rows) {
    if (isFeatureFlag(feature)) byFlag[feature].push(toUser(user));
  }
  return byFlag;
}

export async function isFeatureFlagEnabled(
  userId: string | undefined,
  feature: FeatureFlag
): Promise<boolean> {
  if (!userId) return false;

  const db = getDatabase();
  const [row] = await db
    .select({ enabled: userFeatureFlags.enabled })
    .from(userFeatureFlags)
    .where(
      and(
        eq(userFeatureFlags.userId, userId),
        eq(userFeatureFlags.feature, feature)
      )
    )
    .limit(1);

  return row?.enabled ?? false;
}

export async function setFeatureFlag(
  userId: string,
  feature: FeatureFlag,
  enabled: boolean
): Promise<void> {
  const db = getDatabase();
  await db
    .insert(userFeatureFlags)
    .values({ userId, feature, enabled })
    .onConflictDoUpdate({
      target: [userFeatureFlags.userId, userFeatureFlags.feature],
      set: { enabled, updatedAt: sql`CURRENT_TIMESTAMP` },
    });
}

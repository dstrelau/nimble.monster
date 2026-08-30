import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { userFeatureFlags } from "@/lib/db/schema";

export type FeatureFlag = "class-draft-autosave" | "random-tables";

export const FEATURE_FLAGS: readonly FeatureFlag[] = [
  "class-draft-autosave",
  "random-tables",
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

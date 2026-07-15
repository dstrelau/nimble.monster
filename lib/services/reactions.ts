import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type ReactableEntityType,
  type ReactionType,
  reactions,
} from "@/lib/db/schema";
import { syncLikeCount } from "@/lib/services/reactableEntities";

export const REACTION_TYPES: ReactionType[] = ["thumbs_up", "thumbs_down"];

export interface ReactionsSummary {
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
}

const emptyCounts = (): Record<ReactionType, number> => ({
  thumbs_up: 0,
  thumbs_down: 0,
});

const oppositeReaction = (reactionType: ReactionType): ReactionType =>
  reactionType === "thumbs_up" ? "thumbs_down" : "thumbs_up";

export async function getReactionsSummary(
  entityType: ReactableEntityType,
  entityId: string,
  userId: string
): Promise<ReactionsSummary> {
  const db = getDatabase();

  const countRows = await db
    .select({
      reactionType: reactions.reactionType,
      count: sql<number>`count(*)`,
    })
    .from(reactions)
    .where(
      and(
        eq(reactions.entityType, entityType),
        eq(reactions.entityId, entityId)
      )
    )
    .groupBy(reactions.reactionType);

  const mineRows = await db
    .select({ reactionType: reactions.reactionType })
    .from(reactions)
    .where(
      and(
        eq(reactions.entityType, entityType),
        eq(reactions.entityId, entityId),
        eq(reactions.userId, userId)
      )
    );

  const counts = emptyCounts();
  for (const row of countRows) counts[row.reactionType] = row.count;

  return { counts, mine: mineRows.map((r) => r.reactionType) };
}

export async function toggleReaction(
  entityType: ReactableEntityType,
  entityId: string,
  userId: string,
  reactionType: ReactionType
): Promise<ReactionsSummary> {
  const db = getDatabase();

  const deleteResult = await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.entityType, entityType),
        eq(reactions.entityId, entityId),
        eq(reactions.userId, userId),
        eq(reactions.reactionType, reactionType)
      )
    );

  if (deleteResult.rowsAffected === 0) {
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.entityType, entityType),
          eq(reactions.entityId, entityId),
          eq(reactions.userId, userId),
          eq(reactions.reactionType, oppositeReaction(reactionType))
        )
      );
    await db
      .insert(reactions)
      .values({ entityType, entityId, userId, reactionType });
  }

  const summary = await getReactionsSummary(entityType, entityId, userId);

  await syncLikeCount(entityType, entityId, summary.counts.thumbs_up);

  return summary;
}

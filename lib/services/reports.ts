import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";
import { reports, users } from "@/lib/db/schema";
import {
  ENTITY_TYPE_LABELS,
  resolveEntities,
} from "@/lib/services/reactableEntities";

export async function createReport(
  entityType: ReactableEntityType,
  entityId: string,
  userId: string,
  reason: ReportReason,
  details: string
): Promise<void> {
  const db = getDatabase();
  await db
    .insert(reports)
    .values({ entityType, entityId, userId, reason, details })
    .onConflictDoNothing();
}

export async function hasUserReported(
  entityType: ReactableEntityType,
  entityId: string,
  userId: string
): Promise<boolean> {
  const db = getDatabase();
  const rows = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.entityType, entityType),
        eq(reports.entityId, entityId),
        eq(reports.userId, userId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export interface ReportWithDetails {
  id: string;
  entityType: ReactableEntityType;
  entityTypeLabel: string;
  entityId: string;
  entityName: string;
  entityUrl: string;
  reporterName: string | null;
  reporterUsername: string | null;
  reason: ReportReason;
  details: string;
  createdAt: string | null;
}

export async function getAllReports(): Promise<ReportWithDetails[]> {
  const db = getDatabase();

  const rows = await db
    .select({
      id: reports.id,
      entityType: reports.entityType,
      entityId: reports.entityId,
      reporterName: users.displayName,
      reporterUsername: users.username,
      reason: reports.reason,
      details: reports.details,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .innerJoin(users, eq(reports.userId, users.id))
    .orderBy(desc(reports.createdAt));

  const idsByType = new Map<ReactableEntityType, string[]>();
  for (const row of rows) {
    const ids = idsByType.get(row.entityType) ?? [];
    ids.push(row.entityId);
    idsByType.set(row.entityType, ids);
  }

  const entityInfoByType = new Map<
    ReactableEntityType,
    Awaited<ReturnType<typeof resolveEntities>>
  >();
  for (const [entityType, ids] of idsByType) {
    entityInfoByType.set(entityType, await resolveEntities(entityType, ids));
  }

  const withDetails: ReportWithDetails[] = [];
  for (const row of rows) {
    const info = entityInfoByType.get(row.entityType)?.get(row.entityId);
    // Entity may have been deleted after being reported; drop it from view.
    if (!info) continue;
    withDetails.push({
      ...row,
      entityTypeLabel: ENTITY_TYPE_LABELS[row.entityType],
      entityName: info.name,
      entityUrl: info.url,
    });
  }
  return withDetails;
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ownCollectionsQueryOptions } from "@/app/collections/ownCollectionsQueryOptions";
import { ownEncountersQueryOptions } from "@/app/encounters/ownEncountersQueryOptions";
import type { ReactableEntityType } from "@/lib/db/schema";
import { entityReactionsQueryOptions } from "@/lib/hooks/entityReactionsQueryOptions";
import { entityReportQueryOptions } from "@/lib/hooks/entityReportQueryOptions";
import {
  officialConditionsQueryOptions,
  userConditionsQueryOptions,
} from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";

interface HydratedEntityDetailProps {
  authenticated: boolean;
  entityType: ReactableEntityType;
  entityId: string;
  creatorDiscordId?: string;
  viewerDiscordId?: string;
  includeCollections?: boolean;
  includeEncounters?: boolean;
  children: ReactNode;
}

export async function HydratedEntityDetail({
  authenticated,
  entityType,
  entityId,
  creatorDiscordId,
  viewerDiscordId,
  includeCollections = true,
  includeEncounters = false,
  children,
}: HydratedEntityDetailProps) {
  const queryClient = getQueryClient();
  const queries = [queryClient.prefetchQuery(officialConditionsQueryOptions())];

  const conditionDiscordIds = new Set(
    [creatorDiscordId, viewerDiscordId].filter(
      (discordId): discordId is string => Boolean(discordId)
    )
  );
  for (const discordId of conditionDiscordIds) {
    queries.push(
      queryClient.prefetchQuery(userConditionsQueryOptions({ discordId }))
    );
  }

  if (authenticated) {
    queries.push(
      queryClient.prefetchQuery(
        entityReactionsQueryOptions(entityType, entityId)
      ),
      queryClient.prefetchQuery(entityReportQueryOptions(entityType, entityId))
    );
    if (includeCollections) {
      queries.push(queryClient.prefetchQuery(ownCollectionsQueryOptions()));
    }
    if (includeEncounters) {
      queries.push(queryClient.prefetchQuery(ownEncountersQueryOptions()));
    }
  }

  await Promise.all(queries);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

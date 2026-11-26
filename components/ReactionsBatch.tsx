"use client";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  getMyReactionsBatch,
  MAX_REACTIONS_BATCH,
} from "@/app/%5Factions/getMyReactionsBatch/contract";
import { call } from "@/lib/contract";
import type { ReactableEntityType } from "@/lib/db/schema";
import { entityReactionsQueryOptions } from "@/lib/hooks/entityReactionsQueryOptions";

/** One page of cards whose reactions load in a single request. */
export interface ReactionsBatchPage {
  entityType: ReactableEntityType;
  ids: string[];
}

const BatchedReactionsContext = createContext<ReadonlySet<string>>(new Set());

const batchKey = (entityType: ReactableEntityType, id: string) =>
  `${entityType}:${id}`;

/** Whether a ReactionsBatch above this card loads its reactions. */
export function useIsReactionBatched(
  entityType: ReactableEntityType,
  entityId: string
) {
  return useContext(BatchedReactionsContext).has(
    batchKey(entityType, entityId)
  );
}

/**
 * Loads the signed-in viewer's reactions for each page of cards with one
 * request per page, seeding each card's own reaction query so the cards
 * inside skip their individual requests.
 */
export function ReactionsBatch({
  pages,
  children,
}: {
  pages: ReactionsBatchPage[];
  children: ReactNode;
}) {
  const parent = useContext(BatchedReactionsContext);
  const { status, data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const requests = pages.flatMap(({ entityType, ids }) => {
    const unique = [...new Set(ids)];
    const chunks: ReactionsBatchPage[] = [];
    for (let i = 0; i < unique.length; i += MAX_REACTIONS_BATCH) {
      chunks.push({
        entityType,
        ids: unique.slice(i, i + MAX_REACTIONS_BATCH),
      });
    }
    return chunks;
  });

  useQueries({
    queries: requests.map(({ entityType, ids }) => ({
      queryKey: ["reactions-batch", entityType, ids, userId],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const requestedAt = Date.now();
        const summaries = await call(
          getMyReactionsBatch,
          { entityType, entityIds: ids },
          { signal }
        );
        for (const [id, summary] of Object.entries(summaries)) {
          const { queryKey } = entityReactionsQueryOptions(
            entityType,
            id,
            userId
          );
          // Keep a toggle that landed while this request was in flight.
          const updatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt;
          if (!updatedAt || updatedAt < requestedAt) {
            queryClient.setQueryData(queryKey, summary);
          }
        }
        return summaries;
      },
      enabled: status === "authenticated",
      // Only the viewer changes their own reactions, and toggling updates
      // the card's query directly.
      staleTime: 5 * 60 * 1000,
    })),
  });

  const keys = requests
    .flatMap(({ entityType, ids }) => ids.map((id) => batchKey(entityType, id)))
    .join(" ");
  const batched = useMemo(
    () => new Set([...parent, ...keys.split(" ").filter(Boolean)]),
    [parent, keys]
  );

  return (
    <BatchedReactionsContext.Provider value={batched}>
      {children}
    </BatchedReactionsContext.Provider>
  );
}

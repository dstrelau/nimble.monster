"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toggleReaction } from "@/app/%5Factions/toggleReaction/contract";
import { call } from "@/lib/contract";
import type { ReactableEntityType, ReactionType } from "@/lib/db/schema";
import { entityReactionsQueryOptions } from "./entityReactionsQueryOptions";

export function useEntityReactions(
  entityType: ReactableEntityType,
  entityId: string
) {
  const { status, data: session } = useSession();
  const queryClient = useQueryClient();
  const options = entityReactionsQueryOptions(
    entityType,
    entityId,
    session?.user?.id
  );

  const query = useQuery({
    ...options,
    enabled: status === "authenticated",
  });

  const mutation = useMutation({
    mutationFn: async (reactionType: ReactionType) => {
      const queryKey = options.queryKey;
      const result = await call(toggleReaction, {
        entityType,
        entityId,
        reactionType,
      });
      return { result, queryKey };
    },
    onSuccess: ({ result, queryKey }) => {
      if (result.success && result.data) {
        queryClient.setQueryData(queryKey, result.data);
      }
    },
  });

  return {
    isAuthenticated: status === "authenticated",
    counts: query.data?.counts,
    mine: query.data?.mine ?? [],
    toggle: (reactionType: ReactionType) => mutation.mutate(reactionType),
  };
}

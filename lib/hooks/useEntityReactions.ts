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
  const { status } = useSession();
  const queryClient = useQueryClient();
  const queryKey = ["reactions", entityType, entityId] as const;

  const query = useQuery({
    ...entityReactionsQueryOptions(entityType, entityId),
    enabled: status === "authenticated",
  });

  const mutation = useMutation({
    mutationFn: (reactionType: ReactionType) =>
      call(toggleReaction, { entityType, entityId, reactionType }),
    onSuccess: (result) => {
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

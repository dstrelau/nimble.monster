"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getMyReactions, toggleMyReaction } from "@/app/actions/reactions";
import type { ReactableEntityType, ReactionType } from "@/lib/db/schema";

export function useEntityReactions(
  entityType: ReactableEntityType,
  entityId: string
) {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const queryKey = ["reactions", entityType, entityId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => getMyReactions(entityType, entityId),
    enabled: status === "authenticated",
  });

  const mutation = useMutation({
    mutationFn: (reactionType: ReactionType) =>
      toggleMyReaction(entityType, entityId, reactionType),
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

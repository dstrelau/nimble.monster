import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  loadConditionsForDiscordId,
  loadOfficialConditions,
} from "@/app/actions/conditions";
import type { Condition } from "@/lib/types";

interface UseConditionsOptions {
  creatorId?: string;
  enabled?: boolean;
  staleTime?: number;
}

export function useConditions({
  creatorId,
  enabled = true,
  staleTime = 60 * 1000,
}: UseConditionsOptions = {}) {
  const creatorConditions = useQuery({
    queryKey: ["conditions", creatorId],
    queryFn: () => loadConditionsForDiscordId(creatorId || ""),
    staleTime,
    enabled: enabled && !!creatorId,
  });

  const { data: session } = useSession();
  const ownConds = useQuery({
    queryKey: ["conditions", session?.user?.id],
    queryFn: () => loadConditionsForDiscordId(session?.user?.id || ""),
    staleTime,
    enabled: enabled && !!session?.user,
  });

  const officialConds = useQuery({
    queryKey: ["conditions", "official"],
    queryFn: loadOfficialConditions,
    staleTime,
    enabled,
  });

  const isLoading =
    creatorConditions.isLoading ||
    ownConds.isLoading ||
    officialConds.isLoading;

  const allConditions: Condition[] = [
    ...(creatorConditions?.data ?? []),
    ...(ownConds?.data ?? []),
    ...(officialConds?.data ?? []),
  ];

  return {
    creatorConditions,
    ownConds,
    officialConds,
    allConditions,
    isLoading,
  };
}

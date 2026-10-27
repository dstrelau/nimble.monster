import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { loadConditionsForDiscordId } from "@/app/%5Factions/loadConditionsForDiscordId/contract";
import { loadOfficialConditions } from "@/app/%5Factions/loadOfficialConditions/contract";
import { call } from "@/lib/contract";
import type { Condition } from "@/lib/types";

export function officialConditionsQueryOptions(props?: {
  staleTime?: number;
  enabled?: boolean;
}) {
  return {
    ...props,
    queryKey: ["conditions", "official"],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(loadOfficialConditions, undefined, { signal }),
  };
}

export function userConditionsQueryOptions({
  discordId,
  ...props
}: {
  staleTime?: number;
  enabled?: boolean;
  discordId?: string;
}) {
  return {
    ...props,
    queryKey: ["conditions", discordId],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(
        loadConditionsForDiscordId,
        { discordId: discordId ?? "" },
        { signal }
      ),
    enabled: (props?.enabled ?? true) && !!discordId,
  };
}

interface UseConditionsOptions {
  creatorId?: string;
  enabled?: boolean;
  staleTime?: number;
}

export function useConditions({
  creatorId: discordId,
  enabled = true,
  staleTime = 60 * 1000,
}: UseConditionsOptions = {}) {
  const creatorConditions = useQuery(
    userConditionsQueryOptions({ staleTime, discordId })
  );

  const { data: session } = useSession();
  const ownConds = useQuery(
    userConditionsQueryOptions({
      staleTime,
      discordId: session?.user?.discordId,
    })
  );

  const officialConds = useQuery(
    officialConditionsQueryOptions({
      staleTime,
      enabled,
    })
  );

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

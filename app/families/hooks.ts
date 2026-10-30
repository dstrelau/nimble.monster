import { useQuery } from "@tanstack/react-query";
import { getUserFamilies } from "@/app/%5Factions/getUserFamilies/contract";
import { call } from "@/lib/contract";

interface UserFamiliesQueryProps {
  userId: string | undefined;
  enabled?: boolean;
}

export function useUserFamiliesQuery(props: UserFamiliesQueryProps) {
  return useQuery(userFamiliesQueryOptions(props));
}

export function userFamiliesQueryOptions(props: UserFamiliesQueryProps) {
  return {
    queryKey: ["user-families", props.userId],
    enabled: Boolean(props.userId) && props.enabled !== false,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(getUserFamilies, undefined, { signal }),
  };
}

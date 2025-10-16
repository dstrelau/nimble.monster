import { useQuery } from "@tanstack/react-query";
import { getUserFamilies } from "./actions";

export function useUserFamiliesQuery(props: { enabled?: boolean }) {
  return useQuery(userFamiliesQueryOptions(props));
}

export function userFamiliesQueryOptions(props?: { enabled?: boolean }) {
  return {
    ...props,
    queryKey: ["user-families"],
    queryFn: async () => {
      const result = await getUserFamilies();
      return result.success ? result.families : [];
    },
  };
}

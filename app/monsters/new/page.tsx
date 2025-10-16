import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { userFamiliesQueryOptions } from "@/app/families/hooks";
import BuildMonsterView from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import {
  officialConditionsQueryOptions,
  userConditionsQueryOptions,
} from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { monsterSourcesQueryOptions } from "../hooks";

export default async function NewMonsterPage() {
  const session = await auth();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(userFamiliesQueryOptions());
  void queryClient.prefetchQuery(monsterSourcesQueryOptions());
  void queryClient.prefetchQuery(officialConditionsQueryOptions());
  void queryClient.prefetchQuery(
    userConditionsQueryOptions({ discordId: session?.user?.discordId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildMonsterView />
    </HydrationBoundary>
  );
}

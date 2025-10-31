import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { userFamiliesQueryOptions } from "@/app/families/hooks";
import BuildMonsterView from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import {
  officialConditionsQueryOptions,
  userConditionsQueryOptions,
} from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { monstersService } from "@/lib/services/monsters";
import { deslugify } from "@/lib/utils/slug";
import { monsterSourcesQueryOptions } from "../hooks";

export default async function NewMonsterPage({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string }>;
}) {
  const session = await auth();
  const queryClient = getQueryClient();
  const { remix: remixSlug } = await searchParams;

  let sourceMonster = null;
  let remixId: string | undefined;
  if (remixSlug) {
    const uuid = deslugify(remixSlug);
    if (uuid) {
      remixId = uuid;
      sourceMonster = await monstersService.getMonster(uuid);
      if (!sourceMonster) {
        remixId = undefined;
        sourceMonster = null;
      }
    }
  }

  await Promise.all([
    queryClient.prefetchQuery(userFamiliesQueryOptions()),
    queryClient.prefetchQuery(monsterSourcesQueryOptions()),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
    queryClient.prefetchQuery(
      userConditionsQueryOptions({ discordId: session?.user?.discordId })
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildMonsterView
        existingMonster={sourceMonster || undefined}
        remixedFromId={remixId}
      />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import BuildMonsterView from "@/app/monsters/BuildMonsterView";
import { monsterSourcesQueryOptions } from "@/app/monsters/hooks";
import { auth } from "@/lib/auth";
import {
  officialConditionsQueryOptions,
  userConditionsQueryOptions,
} from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import {
  getPublicOrOwnedHazard,
  toHazardMonsterView,
} from "@/lib/services/hazards";
import { deslugify } from "@/lib/utils/slug";

export default async function NewHazardPage({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string }>;
}) {
  const session = await auth();
  const queryClient = getQueryClient();
  const { remix: remixSlug } = await searchParams;

  let sourceHazard = null;
  let remixId: string | undefined;
  if (remixSlug) {
    const uuid = deslugify(remixSlug);
    if (uuid) {
      const hazard = await getPublicOrOwnedHazard(
        uuid,
        session?.user?.discordId
      );
      if (hazard) {
        sourceHazard = hazard;
        remixId = uuid;
      }
    }
  }

  await Promise.all([
    queryClient.prefetchQuery(monsterSourcesQueryOptions()),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
    queryClient.prefetchQuery(
      userConditionsQueryOptions({ discordId: session?.user?.discordId })
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildMonsterView
        hazard
        existingMonster={
          sourceHazard ? toHazardMonsterView(sourceHazard) : undefined
        }
        remixedFromId={remixId}
      />
    </HydrationBoundary>
  );
}

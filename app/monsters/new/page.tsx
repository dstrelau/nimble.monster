import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { userFamiliesQueryOptions } from "@/app/families/hooks";
import BuildMonsterView from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import {
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db/condition";
import { listFamiliesForUser } from "@/lib/db/family";
import {
  officialConditionsQueryOptions,
  userConditionsQueryOptions,
} from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { monstersService } from "@/lib/services/monsters";
import { deslugify } from "@/lib/utils/slug";

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
    session?.user?.id && session.user.discordId
      ? queryClient.prefetchQuery({
          ...userFamiliesQueryOptions({ userId: session.user.id }),
          queryFn: () => listFamiliesForUser(session.user.discordId),
        })
      : undefined,
    queryClient.prefetchQuery({
      ...officialConditionsQueryOptions(),
      queryFn: listOfficialConditions,
    }),
    queryClient.prefetchQuery({
      ...userConditionsQueryOptions({ discordId: session?.user?.discordId }),
      queryFn: () => listConditionsForDiscordId(session?.user?.discordId ?? ""),
    }),
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

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildMonster from "@/app/monsters/BuildMonsterView";
import { monsterSourcesQueryOptions } from "@/app/monsters/hooks";
import { auth } from "@/lib/auth";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { getOwnedHazard, toHazardMonsterView } from "@/lib/services/hazards";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterEditUrl } from "@/lib/utils/url";

export default async function EditHazardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const hazard = await getOwnedHazard(uid, session.user.id);
  if (!hazard) return notFound();
  if (id !== slugify(hazard)) permanentRedirect(getMonsterEditUrl(hazard));

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(monsterSourcesQueryOptions()),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildMonster existingMonster={toHazardMonsterView(hazard)} hazard />
    </HydrationBoundary>
  );
}

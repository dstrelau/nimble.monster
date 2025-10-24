import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import { userFamiliesQueryOptions } from "@/app/families/hooks";
import BuildMonster from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { findMonsterWithCreatorId } from "@/lib/services/monsters";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterEditUrl } from "@/lib/utils/url";
import { monsterSourcesQueryOptions } from "../../hooks";

export default async function EditMonsterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: monsterId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(monsterId);
  if (!uid) return notFound();
  const monster = await findMonsterWithCreatorId(uid, session?.user.id);
  if (!monster) return notFound();

  if (monsterId !== slugify(monster)) {
    return permanentRedirect(getMonsterEditUrl(monster));
  }

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(userFamiliesQueryOptions()),
    queryClient.prefetchQuery(monsterSourcesQueryOptions()),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildMonster existingMonster={monster} />
    </HydrationBoundary>
  );
}

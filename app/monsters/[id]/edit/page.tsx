import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import { userFamiliesQueryOptions } from "@/app/families/hooks";
import BuildMonster from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import { findMonsterWithCreatorId } from "@/lib/db/monster";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
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
  const monster = await findMonsterWithCreatorId(uid, session?.user.id);
  if (!monster) return notFound();

  if (monsterId !== slugify(monster)) {
    return permanentRedirect(getMonsterEditUrl(monster));
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(userFamiliesQueryOptions());
  void queryClient.prefetchQuery(monsterSourcesQueryOptions());
  void queryClient.prefetchQuery(officialConditionsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildMonster existingMonster={monster} />
    </HydrationBoundary>
  );
}

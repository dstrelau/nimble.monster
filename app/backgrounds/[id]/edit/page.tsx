import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildBackgroundView from "@/app/backgrounds/BuildBackgroundView";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { findBackgroundWithCreatorId } from "@/lib/services/backgrounds";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getBackgroundEditUrl } from "@/lib/utils/url";

export default async function EditBackgroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: backgroundId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(backgroundId);
  if (!uid) return notFound();
  const background = await findBackgroundWithCreatorId(uid, session?.user.id);
  if (!background) return notFound();

  if (backgroundId !== slugify(background)) {
    return permanentRedirect(getBackgroundEditUrl(background));
  }

  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildBackgroundView background={background} />
    </HydrationBoundary>
  );
}

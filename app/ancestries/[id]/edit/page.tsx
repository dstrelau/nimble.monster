import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildAncestryView from "@/app/ancestries/BuildAncestryView";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/queryClient";
import { findAncestryWithCreatorId } from "@/lib/services/ancestries";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getAncestryEditUrl } from "@/lib/utils/url";

export default async function EditAncestryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ancestryId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(ancestryId);
  if (!uid) return notFound();
  const ancestry = await findAncestryWithCreatorId(uid, session?.user.id);
  if (!ancestry) return notFound();

  if (ancestryId !== slugify(ancestry)) {
    return permanentRedirect(getAncestryEditUrl(ancestry));
  }

  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuildAncestryView ancestry={ancestry} />
    </HydrationBoundary>
  );
}

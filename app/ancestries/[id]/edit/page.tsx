import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildAncestryView from "@/app/ancestries/BuildAncestryView";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import { auth } from "@/lib/auth";
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

  return (
    <HydratedBuilderData includeSources>
      <BuildAncestryView ancestry={ancestry} />
    </HydratedBuilderData>
  );
}

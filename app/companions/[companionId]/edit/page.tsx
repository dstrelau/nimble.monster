import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildCompanionView from "@/app/companions/BuildCompanionView";
import { auth } from "@/lib/auth";
import { findCompanionWithCreator } from "@/lib/db/companion";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCompanionUrl } from "@/lib/utils/url";

export default async function EditCompanionPage({
  params,
}: {
  params: Promise<{ companionId: string }>;
}) {
  const { companionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(companionId);

  const companion = await findCompanionWithCreator(uid, session?.user.id);
  if (!companion) return notFound();
  if (companionId !== slugify(companion)) {
    return permanentRedirect(getCompanionUrl(companion));
  }

  return <BuildCompanionView existingCompanion={companion} />;
}

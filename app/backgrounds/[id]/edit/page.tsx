import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildBackgroundView from "@/app/backgrounds/BuildBackgroundView";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import { auth } from "@/lib/auth";
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

  return (
    <HydratedBuilderData includeSources>
      <BuildBackgroundView background={background} />
    </HydratedBuilderData>
  );
}

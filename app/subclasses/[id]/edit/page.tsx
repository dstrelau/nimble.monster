import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildSubclass from "@/app/subclasses/BuildSubclassView";
import { auth } from "@/lib/auth";
import { findSubclassWithCreatorDiscordId } from "@/lib/db/subclass";
import { deslugify } from "@/lib/utils/slug";
import { getSubclassEditUrl, getSubclassSlug } from "@/lib/utils/url";

export default async function EditSubclassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(id);
  if (!uid) return notFound();
  const subclass = await findSubclassWithCreatorDiscordId(
    uid,
    session?.user.discordId
  );
  if (!subclass) return notFound();

  if (id !== getSubclassSlug(subclass)) {
    return permanentRedirect(getSubclassEditUrl(subclass));
  }

  return <BuildSubclass subclass={subclass} />;
}

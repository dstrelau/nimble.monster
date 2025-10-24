import { notFound, permanentRedirect, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getFamilyEditUrl } from "@/lib/utils/url";
import { CreateEditFamily } from "../../CreateEditFamily";

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const family = await db.getFamily(uid);
  if (!family) return notFound();

  if (id !== slugify(family)) {
    return permanentRedirect(getFamilyEditUrl(family));
  }

  if (!session?.user?.id || session.user.discordId !== family.creatorId) {
    redirect(`/families/${id}`);
  }

  return <CreateEditFamily family={family} />;
}

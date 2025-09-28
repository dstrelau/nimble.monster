import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildMonster from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import { findMonsterWithCreatorId } from "@/lib/db/monster";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterEditUrl } from "@/lib/utils/url";

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

  return <BuildMonster existingMonster={monster} />;
}

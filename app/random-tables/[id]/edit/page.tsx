import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getRandomTableEditUrl } from "@/lib/utils/url";
import { CreateEditRandomTable } from "../../CreateEditRandomTable";

export default async function EditRandomTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (
    !session?.user?.id ||
    !(await isFeatureFlagEnabled(session.user.id, "random-tables"))
  ) {
    return notFound();
  }

  const uid = deslugify(id);
  if (!uid) return notFound();
  const randomTable = await db.getRandomTable(uid, session.user.discordId);
  if (!randomTable) return notFound();

  if (randomTable.creator.discordId !== session.user.discordId) {
    return notFound();
  }

  if (id !== slugify(randomTable)) {
    return permanentRedirect(getRandomTableEditUrl(randomTable));
  }

  return (
    <div>
      <CreateEditRandomTable randomTable={randomTable} />
    </div>
  );
}

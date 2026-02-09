import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import * as monstersRepo from "@/lib/services/monsters/repository";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCollectionEditUrl } from "@/lib/utils/url";
import { CreateEditCollection } from "../../CreateEditCollection";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const collection = await db.getCollection(uid, session.user.discordId);
  if (!collection) return notFound();

  if (id !== slugify(collection)) {
    return permanentRedirect(getCollectionEditUrl(collection));
  }

  const myMonsters = await monstersRepo.listAllMonstersForDiscordID(
    session.user.discordId
  );

  return (
    <div>
      <CreateEditCollection collection={collection} myMonsters={myMonsters} />
    </div>
  );
}

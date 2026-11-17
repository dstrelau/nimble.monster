import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import {
  getFeaturedMembership,
  MONSTERY_MONDAY,
} from "@/lib/services/collections/queries";
import { hasPermission } from "@/lib/services/permissions";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCollectionEditUrl } from "@/lib/utils/url";
import { CreateEditCollection } from "../../CreateEditCollection";
import { HydratedCollectionEditor } from "../../HydratedCollectionEditor";

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

  const monsteryMonday =
    collection.creator.id === session.user.id &&
    (await hasPermission(session.user.id, "monstery-monday"))
      ? await getFeaturedMembership(collection.id, MONSTERY_MONDAY)
      : undefined;

  return (
    <HydratedCollectionEditor>
      <div>
        <CreateEditCollection
          collection={collection}
          monsteryMonday={monsteryMonday}
        />
      </div>
    </HydratedCollectionEditor>
  );
}

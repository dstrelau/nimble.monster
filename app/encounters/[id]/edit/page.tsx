import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getEncounterEditUrl } from "@/lib/utils/url";
import { CreateEditEncounter } from "../../CreateEditEncounter";

export default async function EditEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const encounter = await db.getEncounter(uid, session.user.discordId);
  if (!encounter) return notFound();

  if (id !== slugify(encounter)) {
    return permanentRedirect(getEncounterEditUrl(encounter));
  }

  return (
    <div>
      <CreateEditEncounter encounter={encounter} />
    </div>
  );
}

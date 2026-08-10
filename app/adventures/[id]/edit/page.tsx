import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AdventureForm } from "@/app/adventures/AdventureForm";
import { auth } from "@/lib/auth";
import { findAdventure } from "@/lib/db/adventures";
import { listAccessibleEncounterOverviews } from "@/lib/db/encounter";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getAdventureEditUrl } from "@/lib/utils/url";

export const metadata: Metadata = {
  title: `Edit Adventure - ${SITE_NAME}`,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAdventurePage({ params }: PageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();

  const [adventure, session] = await Promise.all([findAdventure(uid), auth()]);
  if (!adventure || adventure.creator.id !== session?.user?.id) notFound();
  if (id !== slugify(adventure)) {
    permanentRedirect(getAdventureEditUrl(adventure));
  }

  const accessibleEncounters = await listAccessibleEncounterOverviews(
    session.user.id
  );
  const encounterMap = new Map(
    accessibleEncounters.map((encounter) => [encounter.id, encounter])
  );
  for (const node of adventure.nodes) {
    if (node.encounter) encounterMap.set(node.encounter.id, node.encounter);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <AdventureForm
        adventureId={adventure.id}
        initialValue={{
          name: adventure.name,
          tagline: adventure.tagline,
          summary: adventure.summary,
          visibility: adventure.visibility,
          nodes: adventure.nodes.map((node) => ({
            id: node.id,
            parentId: node.parentId,
            kind: node.kind,
            orderIndex: node.orderIndex,
            title: node.title,
            content: node.content,
            encounterId: node.encounter?.id ?? null,
            monsterId:
              node.statblock?.entityType === "monster"
                ? node.statblock.entity.id
                : null,
            itemId:
              node.statblock?.entityType === "item"
                ? node.statblock.entity.id
                : null,
            imageId: node.image?.id ?? null,
            imageExtension: node.image?.extension ?? null,
            caption: node.caption,
            presentation: node.presentation,
          })),
        }}
        creator={adventure.creator}
        encounters={[...encounterMap.values()]}
        initialRemovedNodeIds={adventure.nodes.flatMap((node) =>
          node.referenceRemoved ? [node.id] : []
        )}
        initialStatblocks={adventure.nodes.flatMap((node) =>
          node.statblock ? [node.statblock] : []
        )}
      />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AddToEncounterDialog } from "@/app/monsters/AddToEncounterDialog";
import { MonsterDetailActions } from "@/app/monsters/MonsterDetailActions";
import { MonsterRemixes } from "@/app/monsters/MonsterRemixes";
import { AddToCollectionDialog } from "@/components/collection/AddToCollectionDialog";
import { DetailActionBar } from "@/components/DetailActionBar";
import { HydratedEntityDetail } from "@/components/HydratedEntityDetail";
import { Card } from "@/components/monster/Card";
import { MonsterCollections } from "@/components/monster/MonsterCollections";
import { auth } from "@/lib/auth";
import {
  getPublicOrOwnedHazard,
  toHazardMonsterView,
} from "@/lib/services/hazards";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterImageUrl, getMonsterUrl } from "@/lib/utils/url";

async function loadHazard(id: string, viewerDiscordId?: string) {
  const uid = deslugify(id);
  if (!uid) return null;
  return getPublicOrOwnedHazard(uid, viewerDiscordId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const hazard = await loadHazard(id, session?.user?.discordId);
  if (!hazard) return {};
  if (id !== slugify(hazard)) permanentRedirect(getMonsterUrl(hazard));

  const creatorText = hazard.creator ? ` by ${hazard.creator.displayName}` : "";
  return {
    title: hazard.name,
    description: `${hazard.name}, a level ${hazard.level} hazard${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: hazard.name,
      description: `Level ${hazard.level} hazard${creatorText}`,
      type: "article",
      url: getMonsterUrl(hazard),
      images: [
        {
          url: `${getMonsterImageUrl(hazard)}?${hazard.updatedAt.getTime()}`,
          alt: hazard.name,
        },
      ],
    },
  };
}

export default async function HazardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const hazard = await loadHazard(id, session?.user?.discordId);
  if (!hazard) return notFound();
  if (id !== slugify(hazard)) permanentRedirect(getMonsterUrl(hazard));

  const isOwner = session?.user?.discordId === hazard.creator?.discordId;
  const [collections, remixes] = await Promise.all([
    // Hazards retain the monsters JSON:API/storage relationship namespace.
    import("@/lib/services/monsters").then(({ monstersService }) =>
      monstersService.getMonsterCollections(hazard.id)
    ),
    import("@/lib/services/monsters").then(({ monstersService }) =>
      monstersService.getMonsterRemixes(hazard.id)
    ),
  ]);

  return (
    <HydratedEntityDetail
      authenticated={Boolean(session?.user?.id)}
      entityType="monster"
      entityId={hazard.id}
      creatorDiscordId={hazard.creator?.discordId}
      viewerDiscordId={session?.user?.discordId}
      includeEncounters
    >
      <DetailActionBar>
        {session?.user && (
          <>
            <MonsterDetailActions
              monster={toHazardMonsterView(hazard)}
              isOwner={Boolean(isOwner)}
            />
            <AddToCollectionDialog type="hazard" monsterId={hazard.id} />
            <AddToEncounterDialog monsterId={hazard.id} />
          </>
        )}
      </DetailActionBar>
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-12">
        <Card
          monster={toHazardMonsterView(hazard)}
          creator={hazard.creator}
          link={false}
        />
        <MonsterCollections collections={collections} />
        <MonsterRemixes remixes={remixes} />
      </div>
    </HydratedEntityDetail>
  );
}

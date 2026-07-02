import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Card as MonsterCard } from "@/app/ui/monster/Card";
import { EncounterCombatTracker } from "@/components/EncounterCombatTracker";
import { EncounterHeader } from "@/components/EncounterHeader";
import { EncounterStatsPanel } from "@/components/EncounterStatsPanel";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId, listOfficialConditions } from "@/lib/db";
import { monstersSortedByLevelInt } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getEncounterUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const encounter = await db.getEncounter(uid);
  if (!encounter) return {};

  if (id !== slugify(encounter)) {
    return permanentRedirect(getEncounterUrl(encounter));
  }

  const creatorText = encounter.creator?.displayName
    ? ` by ${encounter.creator.displayName}`
    : "";

  const monsterCount = encounter.monsters?.length || 0;
  const countText =
    monsterCount > 0
      ? `${monsterCount} monster${monsterCount !== 1 ? "s" : ""}`
      : "";
  const description = `${countText}${creatorText}`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: encounter.name,
    description: `${encounter.name} - ${countText}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: encounter.name,
      description,
      type: "article",
      url: getEncounterUrl(encounter),
    },
    twitter: {
      card: "summary",
      title: encounter.name,
      description,
    },
  };
}

export default async function ShowEncounterView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const encounter = await db.getEncounter(uid, session?.user?.discordId);
  if (!encounter) return notFound();

  if (id !== slugify(encounter)) {
    return permanentRedirect(getEncounterUrl(encounter));
  }

  const [officialConditions, userConditions] = await Promise.all([
    listOfficialConditions(),
    listConditionsForDiscordId(encounter.creator.discordId),
  ]);
  const conditions = [...officialConditions, ...userConditions];
  if (
    encounter.visibility === "private" &&
    encounter.creator.discordId !== session?.user.discordId
  ) {
    notFound();
  }

  const isCreator = session?.user?.discordId === encounter.creator.discordId;
  const sortedEntries = monstersSortedByLevelInt(
    encounter.monsters.map((e) => e.monster)
  ).map(
    (monster) =>
      encounter.monsters.find((e) => e.monster.id === monster.id) ?? null
  );

  return (
    <div>
      <EncounterHeader
        encounter={encounter}
        showEditDeleteButtons={isCreator}
        conditions={conditions}
      />

      {encounter.monsters.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          This encounter is empty.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 print:col-span-2 grid gap-6 grid-cols-1 md:grid-cols-2 print:grid-cols-2 items-start">
            {sortedEntries.map((entry) =>
              entry ? (
                <div key={entry.monster.id} className="relative">
                  <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1 rounded-full bg-flame px-2.5 py-1 font-slab font-black text-sm text-white shadow-md">
                    &times;{entry.quantity}
                    {entry.isPerHero && (
                      <span className="font-sans text-xs font-normal">
                        /hero
                      </span>
                    )}
                  </div>
                  <MonsterCard
                    monster={entry.monster}
                    creator={entry.monster.creator}
                  />
                </div>
              ) : null
            )}
          </div>
          <div className="lg:col-span-1 print:col-span-1 lg:sticky lg:top-4 print:static flex flex-col gap-6">
            <EncounterStatsPanel encounter={encounter} />
            <EncounterCombatTracker encounter={encounter} />
          </div>
        </div>
      )}
    </div>
  );
}

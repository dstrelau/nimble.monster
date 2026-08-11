import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AdventureInput, AdventureStatblock } from "@/lib/db/adventures";
import { listAccessibleEncounterOverviews } from "@/lib/db/encounter";
import { findOfficialMonstersByNames } from "@/lib/services/monsters/repository";
import { SITE_NAME } from "@/lib/utils/branding";
import { AdventureForm } from "../AdventureForm";
import {
  EXAMPLE_ADVENTURE_IMAGES,
  getExampleAdventures,
} from "../exampleAdventures";

export const metadata: Metadata = {
  title: `New Adventure - ${SITE_NAME}`,
};

const DEFAULT_SECTION_TITLES = [
  "What's Going On?",
  "Quest Hooks",
  "Rumors",
  "Travel Encounters",
  "Adventure Locations",
];

const EMPTY_ADVENTURE: AdventureInput = {
  name: "",
  tagline: "",
  summary: "",
  visibility: "public",
  nodes: DEFAULT_SECTION_TITLES.map((title, orderIndex) => ({
    id: `default-section-${orderIndex}`,
    parentId: null,
    kind: "section",
    orderIndex,
    title,
    content: "",
    encounterId: null,
    monsterIds: [],
    itemIds: [],
    missingStatblockCount: 0,
    presentation: null,
  })),
};

export default async function NewAdventurePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/create");

  const [encounters, officialMonsters] = await Promise.all([
    listAccessibleEncounterOverviews(session.user.id),
    findOfficialMonstersByNames([
      "Goblin Minion",
      "Goblin",
      "Bugbear",
      "Skeleton",
    ]),
  ]);
  const exampleAdventures = getExampleAdventures({
    goblinMinionId: officialMonsters.get("Goblin Minion")?.id,
    goblinId: officialMonsters.get("Goblin")?.id,
    bugbearId: officialMonsters.get("Bugbear")?.id,
    skeletonId: officialMonsters.get("Skeleton")?.id,
  });
  const initialStatblocks = [...officialMonsters.values()].map((entity) => ({
    entityType: "monster",
    entity,
  })) satisfies AdventureStatblock[];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <AdventureForm
        initialValue={EMPTY_ADVENTURE}
        encounters={encounters}
        creator={session.user}
        initialStatblocks={initialStatblocks}
        exampleAdventures={exampleAdventures}
        exampleAdventureImages={EXAMPLE_ADVENTURE_IMAGES}
      />
    </main>
  );
}

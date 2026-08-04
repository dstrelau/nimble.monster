import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AdventureInput } from "@/lib/db/adventures";
import { listAccessibleEncounterOverviews } from "@/lib/db/encounter";
import { SITE_NAME } from "@/lib/utils/branding";
import { AdventureForm } from "../AdventureForm";

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
    monsterId: null,
    itemId: null,
    presentation: null,
  })),
};

export default async function NewAdventurePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/create");

  const encounters = await listAccessibleEncounterOverviews(session.user.id);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <AdventureForm
        initialValue={EMPTY_ADVENTURE}
        encounters={encounters}
        creator={session.user}
      />
    </main>
  );
}

import type { Metadata } from "next";
import { AdventureList } from "@/components/adventure/AdventureList";
import { listPublicAdventures } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `Adventures - ${SITE_NAME}`,
  description: "Browse adventures created by the Nimble community.",
};

export default async function AdventuresPage() {
  const adventures = await listPublicAdventures();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-4xl font-bold">Adventures</h1>
      <AdventureList
        adventures={adventures}
        emptyMessage="No public adventures available"
      />
    </main>
  );
}

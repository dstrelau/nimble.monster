import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  type AncestryWithDiff,
  compareAncestries,
  computeDiffCounts,
} from "@/lib/services/ancestries/diff";
import type { AncestrySessionData } from "@/lib/services/ancestries/official";
import { findOfficialAncestriesByNames } from "@/lib/services/ancestries/repository";
import type { Ancestry } from "@/lib/services/ancestries/types";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { readPreviewSession } from "@/lib/services/preview-session";
import { PreviewContent } from "./PreviewContent";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function PreviewAncestriesPage({
  searchParams,
}: PageProps) {
  if (!(await isAdmin())) {
    notFound();
  }

  const { session: sessionKey } = await searchParams;
  if (!sessionKey) {
    notFound();
  }

  const sessionData = await readPreviewSession<AncestrySessionData>(
    "ancestries",
    sessionKey
  );
  if (!sessionData) {
    notFound();
  }

  const ancestryNames = sessionData.ancestries.map((a) => a.attributes.name);
  const existingMap = await findOfficialAncestriesByNames(ancestryNames);

  const items: AncestryWithDiff[] = sessionData.ancestries.map((a) => {
    const { name, size, rarity, description, abilities } = a.attributes;

    const ancestry: Ancestry = {
      id: "",
      name,
      size,
      rarity,
      description,
      abilities,
      creator: {
        id: OFFICIAL_USER_ID,
        discordId: "",
        username: "nimble-co",
        displayName: "Nimble Co.",
        imageUrl: "/images/nimble-n.png",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      source: sessionData.source
        ? {
            id: "preview",
            name: sessionData.source.name,
            abbreviation: sessionData.source.abbreviation,
            license: sessionData.source.license,
            link: sessionData.source.link,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
    };

    const existing = existingMap.get(name) || null;
    const status = compareAncestries(ancestry, existing);

    return { ancestry, status };
  });

  const diffCounts = computeDiffCounts(items);

  return (
    <PreviewContent
      sessionKey={sessionKey}
      sourceName={sessionData.source?.name}
      items={items}
      diffCounts={diffCounts}
    />
  );
}

import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  type BackgroundWithDiff,
  compareBackgrounds,
  computeDiffCounts,
} from "@/lib/services/backgrounds/diff";
import type { BackgroundSessionData } from "@/lib/services/backgrounds/official";
import { findOfficialBackgroundsByNames } from "@/lib/services/backgrounds/repository";
import type { Background } from "@/lib/services/backgrounds/types";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { readPreviewSession } from "@/lib/services/preview-session";
import { PreviewContent } from "./PreviewContent";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function PreviewBackgroundsPage({
  searchParams,
}: PageProps) {
  if (!(await isAdmin())) {
    notFound();
  }

  const { session: sessionKey } = await searchParams;
  if (!sessionKey) {
    notFound();
  }

  const sessionData = await readPreviewSession<BackgroundSessionData>(
    "backgrounds",
    sessionKey
  );
  if (!sessionData) {
    notFound();
  }

  const backgroundNames = sessionData.backgrounds.map(
    (bg) => bg.attributes.name
  );
  const existingMap = await findOfficialBackgroundsByNames(backgroundNames);

  const items: BackgroundWithDiff[] = sessionData.backgrounds.map((bg) => {
    const { name, description, requirement } = bg.attributes;

    const background: Background = {
      id: "",
      name,
      description,
      requirement,
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
    const status = compareBackgrounds(background, existing);

    return { background, status };
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

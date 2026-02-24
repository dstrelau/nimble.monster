import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { readPreviewSession } from "@/lib/services/preview-session";
import {
  compareSubclasses,
  computeDiffCounts,
  type SubclassWithDiff,
} from "@/lib/services/subclasses/diff";
import type { SubclassSessionData } from "@/lib/services/subclasses/official";
import { findOfficialSubclassesByNames } from "@/lib/services/subclasses/repository";
import {
  SUBCLASS_NAME_PREFIXES,
  type Subclass,
  type SubclassClass,
} from "@/lib/types";
import { PreviewContent } from "./PreviewContent";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function PreviewSubclassesPage({
  searchParams,
}: PageProps) {
  if (!(await isAdmin())) {
    notFound();
  }

  const { session: sessionKey } = await searchParams;
  if (!sessionKey) {
    notFound();
  }

  const sessionData = await readPreviewSession<SubclassSessionData>(
    "subclasses",
    sessionKey
  );
  if (!sessionData) {
    notFound();
  }

  const names = sessionData.subclasses.map((sc) => ({
    name: sc.attributes.name,
    className: sc.attributes.className,
  }));
  const existingMap = await findOfficialSubclassesByNames(names);

  const items: SubclassWithDiff[] = sessionData.subclasses.map((sc) => {
    const { name, className, tagline, description, levels } = sc.attributes;
    const namePreface =
      SUBCLASS_NAME_PREFIXES[className as SubclassClass] || undefined;

    const subclass: Subclass = {
      id: "",
      name,
      className: className as SubclassClass,
      namePreface,
      tagline,
      description,
      visibility: "public",
      levels: levels.map((level) => ({
        level: level.level,
        abilities: level.abilities.map((ability, i) => ({
          id: `preview-${level.level}-${i}`,
          name: ability.name,
          description: ability.description,
        })),
      })),
      abilityLists: [],
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

    const key = `${className}:${name}`;
    const existing = existingMap.get(key) || null;
    const status = compareSubclasses(subclass, existing);

    return { subclass, status };
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

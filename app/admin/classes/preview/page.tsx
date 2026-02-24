import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  type ClassWithDiff,
  compareClasses,
  computeDiffCounts,
} from "@/lib/services/classes/diff";
import {
  type ClassSessionData,
  OFFICIAL_CREATOR,
} from "@/lib/services/classes/official";
import { findOfficialClassesByNames } from "@/lib/services/classes/repository";
import { readPreviewSession } from "@/lib/services/preview-session";
import type { Class } from "@/lib/types";
import { PreviewContent } from "./PreviewContent";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function PreviewClassesPage({ searchParams }: PageProps) {
  if (!(await isAdmin())) {
    notFound();
  }

  const { session: sessionKey } = await searchParams;
  if (!sessionKey) {
    notFound();
  }

  const sessionData = await readPreviewSession<ClassSessionData>(
    "classes",
    sessionKey
  );
  if (!sessionData) {
    notFound();
  }

  const names = sessionData.classes.map((cls) => cls.attributes.name);
  const existingMap = await findOfficialClassesByNames(names);

  const items: ClassWithDiff[] = sessionData.classes.map((cls) => {
    const {
      name,
      description,
      keyStats,
      hitDie,
      startingHp,
      saves,
      armor,
      weapons,
      startingGear,
      levels,
      abilityLists,
    } = cls.attributes;

    const classEntity: Class = {
      id: "",
      name,
      description,
      keyStats: keyStats as Class["keyStats"],
      hitDie: hitDie as Class["hitDie"],
      startingHp,
      saves: saves as Class["saves"],
      armor: armor as Class["armor"],
      weapons: weapons as Class["weapons"],
      startingGear,
      visibility: "public",
      levels: levels.map((level) => ({
        level: level.level,
        abilities: level.abilities.map((ability, i) => ({
          id: `preview-${level.level}-${i}`,
          name: ability.name,
          description: ability.description,
        })),
      })),
      abilityLists: abilityLists.map((list, listIdx) => ({
        id: `preview-list-${listIdx}`,
        name: list.name,
        description: list.description,
        items: list.items.map((item, itemIdx) => ({
          id: `preview-item-${listIdx}-${itemIdx}`,
          name: item.name,
          description: item.description,
        })),
        creator: OFFICIAL_CREATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      creator: OFFICIAL_CREATOR,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existing = existingMap.get(name) || null;
    const status = compareClasses(classEntity, existing);

    return { classEntity, status };
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

import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { readPreviewSession } from "@/lib/services/preview-session";
import {
  compareSpellSchools,
  computeDiffCounts,
  type SpellSchoolWithDiff,
} from "@/lib/services/spell-schools/diff";
import type {
  JSONAPISpellTarget,
  SpellSchoolSessionData,
} from "@/lib/services/spell-schools/official";
import { findOfficialSpellSchoolsByNames } from "@/lib/services/spell-schools/repository";
import type { Spell, SpellSchool, SpellTarget } from "@/lib/types";
import { PreviewContent } from "./PreviewContent";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

function mapTarget(target?: JSONAPISpellTarget): SpellTarget | undefined {
  if (!target) return undefined;
  if (target.type === "self") return { type: "self" };
  if (target.type === "aoe") {
    return {
      type: "aoe",
      kind: target.kind || "range",
      distance: target.distance,
    };
  }
  const kind =
    target.kind === "line" || target.kind === "cone"
      ? "range"
      : target.kind || "range";
  return {
    type: target.type,
    kind,
    distance: target.distance,
  };
}

export default async function PreviewSpellSchoolsPage({
  searchParams,
}: PageProps) {
  if (!(await isAdmin())) {
    notFound();
  }

  const { session: sessionKey } = await searchParams;
  if (!sessionKey) {
    notFound();
  }

  const sessionData = await readPreviewSession<SpellSchoolSessionData>(
    "spell-schools",
    sessionKey
  );
  if (!sessionData) {
    notFound();
  }

  const spellSchoolNames = sessionData.spellSchools.map(
    (sc) => sc.attributes.name
  );
  const existingMap = await findOfficialSpellSchoolsByNames(spellSchoolNames);

  const items: SpellSchoolWithDiff[] = sessionData.spellSchools.map((sc) => {
    const { name, description, spells: jsonSpells } = sc.attributes;

    const spells: Spell[] = jsonSpells.map((s, i) => ({
      id: `preview-${i}`,
      schoolId: "",
      name: s.name,
      tier: s.tier,
      actions: s.actions,
      reaction: s.reaction ?? false,
      target: mapTarget(s.target),
      damage: s.damage,
      description: s.description,
      highLevels: s.highLevels,
      concentration: s.concentration,
      upcast: s.upcast,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const spellSchool: SpellSchool = {
      id: "",
      name,
      description,
      visibility: "public",
      spells,
      creator: {
        id: OFFICIAL_USER_ID,
        discordId: "",
        username: "nimble-co",
        displayName: "Nimble Co.",
        imageUrl: "/images/nimble-n.png",
      },
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
    const status = compareSpellSchools(spellSchool, existing);

    return { spellSchool, status };
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

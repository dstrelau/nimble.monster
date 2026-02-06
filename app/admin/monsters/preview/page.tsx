import { notFound } from "next/navigation";
import type { JSONAPIFamily, JSONAPIMonster } from "@/lib/api/monsters";
import { isAdmin } from "@/lib/auth";
import {
  compareMonsters,
  computeDiffCounts,
  type MonsterWithDiff,
} from "@/lib/services/monsters/diff";
import {
  type OfficialMonstersSource,
  parseJSONAPIMonster,
} from "@/lib/services/monsters/official";
import { readPreviewSession } from "@/lib/services/monsters/preview-session";
import { findOfficialMonstersByNames } from "@/lib/services/monsters/repository";
import type { Monster } from "@/lib/services/monsters/types";
import { PreviewContent } from "./PreviewContent";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

interface Family {
  id: string;
  name: string;
  description?: string;
  abilities: Array<{ name: string; description: string }>;
}

export default async function PreviewMonstersPage({ searchParams }: PageProps) {
  if (!(await isAdmin())) {
    notFound();
  }

  const { session: sessionKey } = await searchParams;
  if (!sessionKey) {
    notFound();
  }

  const sessionData = await readPreviewSession(sessionKey);
  if (!sessionData) {
    notFound();
  }

  const monstersData: JSONAPIMonster[] = sessionData.monsters;
  const familiesMap = new Map<string, JSONAPIFamily>(sessionData.families);
  const source = sessionData.source as OfficialMonstersSource | undefined;

  // Build a map of family ID to family info
  const familyInfoMap = new Map<string, Family>();
  for (const [id, familyData] of familiesMap) {
    familyInfoMap.set(id, {
      id,
      name: familyData.attributes.name,
      description: familyData.attributes.description,
      abilities: familyData.attributes.abilities,
    });
  }

  // Extract all monster names and fetch existing official monsters
  const monsterNames = monstersData.map((data) => data.attributes.name);
  const existingMonstersMap = await findOfficialMonstersByNames(monsterNames);

  // Group monsters by family with diff status
  const monstersByFamily = new Map<string | null, MonsterWithDiff[]>();

  for (const data of monstersData) {
    const input = parseJSONAPIMonster(data);
    const familyRefId = data.relationships?.family?.data?.id || null;

    const families = [];
    if (familyRefId) {
      const familyData = familiesMap.get(familyRefId);
      if (familyData) {
        families.push({
          id: familyRefId,
          name: familyData.attributes.name,
          description: familyData.attributes.description,
          abilities: familyData.attributes.abilities.map((a) => ({
            ...a,
            id: crypto.randomUUID(),
          })),
          creatorId: "official",
          creator: {
            id: "00000000-0000-0000-0000-000000000000",
            discordId: "",
            username: "nimble-co",
            displayName: "Nimble Co.",
            imageUrl: "/images/nimble-n.png",
          },
        });
      }
    }

    const monster: Monster = {
      id: data.id || crypto.randomUUID(),
      name: input.name,
      hp: input.hp,
      level: input.level,
      levelInt: input.levelInt,
      size: input.size,
      armor: input.armor === "" ? "none" : input.armor,
      kind: input.kind,
      legendary: input.legendary || false,
      minion: input.minion || false,
      visibility: input.visibility,
      paperforgeId: input.paperforgeId || undefined,
      createdAt: new Date(),
      isOfficial: true,
      saves: input.saves?.join(" ") ?? "",
      bloodied: input.bloodied,
      lastStand: input.lastStand,
      speed: input.speed,
      fly: input.fly,
      swim: input.swim,
      climb: input.climb,
      teleport: input.teleport,
      burrow: input.burrow,
      abilities: input.abilities,
      actions: input.actions,
      actionPreface: input.actionPreface,
      moreInfo: input.moreInfo,
      families,
      creator: {
        id: "00000000-0000-0000-0000-000000000000",
        discordId: "",
        username: "nimble-co",
        displayName: "Nimble Co.",
        imageUrl: "/images/nimble-n.png",
      },
      updatedAt: new Date(),
      role: input.role,
      source: source
        ? {
            id: "preview",
            name: source.name,
            abbreviation: source.abbreviation,
            license: source.license,
            link: source.link,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
    };

    const existingMonster = existingMonstersMap.get(monster.name) || null;
    const status = compareMonsters(monster, existingMonster);

    const monsterWithDiff: MonsterWithDiff = { monster, status };

    const existing = monstersByFamily.get(familyRefId) || [];
    existing.push(monsterWithDiff);
    monstersByFamily.set(familyRefId, existing);
  }

  // Sort families by name, with null (no family) last
  const sortedFamilyIds = Array.from(monstersByFamily.keys()).sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    const nameA = familyInfoMap.get(a)?.name || "";
    const nameB = familyInfoMap.get(b)?.name || "";
    return nameA.localeCompare(nameB);
  });

  // Compute diff counts
  const allMonstersWithDiff = Array.from(monstersByFamily.values()).flat();
  const diffCounts = computeDiffCounts(allMonstersWithDiff);

  const totalMonsters = monstersData.length;
  const totalFamilies = familiesMap.size;

  return (
    <PreviewContent
      sessionKey={sessionKey}
      sourceName={source?.name}
      totalMonsters={totalMonsters}
      totalFamilies={totalFamilies}
      sortedFamilyIds={sortedFamilyIds}
      monstersByFamily={monstersByFamily}
      familyInfoMap={familyInfoMap}
      diffCounts={diffCounts}
    />
  );
}

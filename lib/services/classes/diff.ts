import type { Class, ClassAbilityList, ClassLevel } from "@/lib/types";

export type DiffStatus = "new" | "updated" | "unchanged";

export interface ClassWithDiff {
  classEntity: Class;
  status: DiffStatus;
}

export interface DiffCounts {
  new: number;
  updated: number;
  unchanged: number;
}

function compareStringArrays(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function compareLevels(
  uploaded: ClassLevel[],
  existing: ClassLevel[]
): boolean {
  if (uploaded.length !== existing.length) return false;

  const sortedU = [...uploaded].sort((a, b) => a.level - b.level);
  const sortedE = [...existing].sort((a, b) => a.level - b.level);

  return sortedU.every((u, i) => {
    const e = sortedE[i];
    if (u.level !== e.level) return false;
    if (u.abilities.length !== e.abilities.length) return false;

    const sortedUA = [...u.abilities].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedEA = [...e.abilities].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return sortedUA.every(
      (ua, j) =>
        ua.name === sortedEA[j].name &&
        ua.description === sortedEA[j].description
    );
  });
}

function compareAbilityLists(
  uploaded: ClassAbilityList[],
  existing: ClassAbilityList[]
): boolean {
  if (uploaded.length !== existing.length) return false;

  const sortedU = [...uploaded].sort((a, b) => a.name.localeCompare(b.name));
  const sortedE = [...existing].sort((a, b) => a.name.localeCompare(b.name));

  return sortedU.every((u, i) => {
    const e = sortedE[i];
    if (u.name !== e.name) return false;
    if (u.description !== e.description) return false;
    if (u.items.length !== e.items.length) return false;

    const sortedUI = [...u.items].sort((a, b) => a.name.localeCompare(b.name));
    const sortedEI = [...e.items].sort((a, b) => a.name.localeCompare(b.name));

    return sortedUI.every(
      (ui, j) =>
        ui.name === sortedEI[j].name &&
        ui.description === sortedEI[j].description
    );
  });
}

export function compareClasses(
  uploaded: Class,
  existing: Class | null
): DiffStatus {
  if (!existing) return "new";

  if (uploaded.name !== existing.name) return "updated";
  if (uploaded.description !== existing.description) return "updated";
  if (uploaded.hitDie !== existing.hitDie) return "updated";
  if (uploaded.startingHp !== existing.startingHp) return "updated";
  if (!compareStringArrays(uploaded.keyStats, existing.keyStats))
    return "updated";
  if (!compareStringArrays(uploaded.armor, existing.armor)) return "updated";
  if (!compareStringArrays(uploaded.startingGear, existing.startingGear))
    return "updated";
  if (JSON.stringify(uploaded.saves) !== JSON.stringify(existing.saves))
    return "updated";
  if (JSON.stringify(uploaded.weapons) !== JSON.stringify(existing.weapons))
    return "updated";
  if (!compareLevels(uploaded.levels, existing.levels)) return "updated";
  if (!compareAbilityLists(uploaded.abilityLists, existing.abilityLists))
    return "updated";

  return "unchanged";
}

export function computeDiffCounts(items: ClassWithDiff[]): DiffCounts {
  return items.reduce(
    (acc, { status }) => {
      acc[status]++;
      return acc;
    },
    { new: 0, updated: 0, unchanged: 0 }
  );
}

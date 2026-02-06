import type { Ability, Action } from "@/lib/types";
import type { Monster } from "./types";

export type DiffStatus = "new" | "updated" | "unchanged";

export interface MonsterWithDiff {
  monster: Monster;
  status: DiffStatus;
}

export interface DiffCounts {
  new: number;
  updated: number;
  unchanged: number;
}

function normalizeArmor(armor: string): string {
  return armor === "" ? "none" : armor;
}

function compareAbilities(uploaded: Ability[], existing: Ability[]): boolean {
  if (uploaded.length !== existing.length) return false;

  const sortedUploaded = [...uploaded].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedExisting = [...existing].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return sortedUploaded.every(
    (u, i) =>
      u.name === sortedExisting[i].name &&
      u.description === sortedExisting[i].description
  );
}

function compareActions(uploaded: Action[], existing: Action[]): boolean {
  if (uploaded.length !== existing.length) return false;

  const sortedUploaded = [...uploaded].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedExisting = [...existing].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return sortedUploaded.every((u, i) => {
    const e = sortedExisting[i];
    return (
      u.name === e.name &&
      (u.description ?? "") === (e.description ?? "") &&
      (u.damage ?? "") === (e.damage ?? "") &&
      (u.range ?? "") === (e.range ?? "")
    );
  });
}

function compareFamilies(
  uploaded: Monster["families"],
  existing: Monster["families"]
): boolean {
  if (uploaded.length !== existing.length) return false;

  const uploadedNames = uploaded.map((f) => f.name).sort();
  const existingNames = existing.map((f) => f.name).sort();

  return uploadedNames.every((name, i) => name === existingNames[i]);
}

export function compareMonsters(
  uploaded: Monster,
  existing: Monster | null
): DiffStatus {
  if (!existing) return "new";

  // Compare scalars
  if (uploaded.name !== existing.name) return "updated";
  if (uploaded.hp !== existing.hp) return "updated";
  if (uploaded.level !== existing.level) return "updated";
  if (uploaded.levelInt !== existing.levelInt) return "updated";
  if (uploaded.size !== existing.size) return "updated";
  if (normalizeArmor(uploaded.armor) !== normalizeArmor(existing.armor))
    return "updated";
  if ((uploaded.kind ?? "") !== (existing.kind ?? "")) return "updated";
  if ((uploaded.role ?? null) !== (existing.role ?? null)) return "updated";
  if (uploaded.legendary !== existing.legendary) return "updated";
  if (uploaded.minion !== existing.minion) return "updated";

  // Compare movement
  if (uploaded.speed !== existing.speed) return "updated";
  if (uploaded.fly !== existing.fly) return "updated";
  if (uploaded.swim !== existing.swim) return "updated";
  if (uploaded.climb !== existing.climb) return "updated";
  if (uploaded.burrow !== existing.burrow) return "updated";
  if (uploaded.teleport !== existing.teleport) return "updated";

  // Compare text fields
  if ((uploaded.actionPreface ?? "") !== (existing.actionPreface ?? ""))
    return "updated";
  if ((uploaded.moreInfo ?? "") !== (existing.moreInfo ?? "")) return "updated";
  if ((uploaded.bloodied ?? "") !== (existing.bloodied ?? "")) return "updated";
  if ((uploaded.lastStand ?? "") !== (existing.lastStand ?? ""))
    return "updated";
  if ((uploaded.saves ?? "") !== (existing.saves ?? "")) return "updated";

  // Compare arrays
  if (!compareAbilities(uploaded.abilities, existing.abilities))
    return "updated";
  if (!compareActions(uploaded.actions, existing.actions)) return "updated";
  if (!compareFamilies(uploaded.families, existing.families)) return "updated";

  return "unchanged";
}

export function computeDiffCounts(
  monstersWithDiff: MonsterWithDiff[]
): DiffCounts {
  return monstersWithDiff.reduce(
    (acc, { status }) => {
      acc[status]++;
      return acc;
    },
    { new: 0, updated: 0, unchanged: 0 }
  );
}

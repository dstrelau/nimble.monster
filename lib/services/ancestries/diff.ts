import type { Ancestry, AncestryAbility } from "./types";

export type DiffStatus = "new" | "updated" | "unchanged";

export interface AncestryWithDiff {
  ancestry: Ancestry;
  status: DiffStatus;
}

export interface DiffCounts {
  new: number;
  updated: number;
  unchanged: number;
}

function compareAbilities(
  uploaded: AncestryAbility[],
  existing: AncestryAbility[]
): boolean {
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

function compareSizes(uploaded: string[], existing: string[]): boolean {
  if (uploaded.length !== existing.length) return false;
  const sortedU = [...uploaded].sort();
  const sortedE = [...existing].sort();
  return sortedU.every((v, i) => v === sortedE[i]);
}

export function compareAncestries(
  uploaded: Ancestry,
  existing: Ancestry | null
): DiffStatus {
  if (!existing) return "new";

  if (uploaded.name !== existing.name) return "updated";
  if (uploaded.rarity !== existing.rarity) return "updated";
  if (uploaded.description !== existing.description) return "updated";
  if (!compareSizes(uploaded.size, existing.size)) return "updated";
  if (!compareAbilities(uploaded.abilities, existing.abilities))
    return "updated";

  return "unchanged";
}

export function computeDiffCounts(items: AncestryWithDiff[]): DiffCounts {
  return items.reduce(
    (acc, { status }) => {
      acc[status]++;
      return acc;
    },
    { new: 0, updated: 0, unchanged: 0 }
  );
}

import type { Subclass } from "@/lib/types";

export type DiffStatus = "new" | "updated" | "unchanged";

export interface SubclassWithDiff {
  subclass: Subclass;
  status: DiffStatus;
}

export interface DiffCounts {
  new: number;
  updated: number;
  unchanged: number;
}

function compareLevels(
  uploaded: Subclass["levels"],
  existing: Subclass["levels"]
): boolean {
  if (uploaded.length !== existing.length) return false;

  const sortedUploaded = [...uploaded].sort((a, b) => a.level - b.level);
  const sortedExisting = [...existing].sort((a, b) => a.level - b.level);

  return sortedUploaded.every((uLevel, i) => {
    const eLevel = sortedExisting[i];
    if (uLevel.level !== eLevel.level) return false;
    if (uLevel.abilities.length !== eLevel.abilities.length) return false;

    const sortedUA = [...uLevel.abilities].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedEA = [...eLevel.abilities].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return sortedUA.every(
      (u, j) =>
        u.name === sortedEA[j].name && u.description === sortedEA[j].description
    );
  });
}

export function compareSubclasses(
  uploaded: Subclass,
  existing: Subclass | null
): DiffStatus {
  if (!existing) return "new";

  if (uploaded.name !== existing.name) return "updated";
  if (uploaded.className !== existing.className) return "updated";
  if ((uploaded.tagline ?? "") !== (existing.tagline ?? "")) return "updated";
  if ((uploaded.description ?? "") !== (existing.description ?? ""))
    return "updated";
  if (!compareLevels(uploaded.levels, existing.levels)) return "updated";

  return "unchanged";
}

export function computeDiffCounts(items: SubclassWithDiff[]): DiffCounts {
  return items.reduce(
    (acc, { status }) => {
      acc[status]++;
      return acc;
    },
    { new: 0, updated: 0, unchanged: 0 }
  );
}

import type { Background } from "./types";

export type DiffStatus = "new" | "updated" | "unchanged";

export interface BackgroundWithDiff {
  background: Background;
  status: DiffStatus;
}

export interface DiffCounts {
  new: number;
  updated: number;
  unchanged: number;
}

export function compareBackgrounds(
  uploaded: Background,
  existing: Background | null
): DiffStatus {
  if (!existing) return "new";

  if (uploaded.name !== existing.name) return "updated";
  if (uploaded.description !== existing.description) return "updated";
  if ((uploaded.requirement ?? "") !== (existing.requirement ?? ""))
    return "updated";

  return "unchanged";
}

export function computeDiffCounts(items: BackgroundWithDiff[]): DiffCounts {
  return items.reduce(
    (acc, { status }) => {
      acc[status]++;
      return acc;
    },
    { new: 0, updated: 0, unchanged: 0 }
  );
}

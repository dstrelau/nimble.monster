import type { SpellSchool } from "@/lib/types";

export type DiffStatus = "new" | "updated" | "unchanged";

export interface SpellSchoolWithDiff {
  spellSchool: SpellSchool;
  status: DiffStatus;
}

export interface DiffCounts {
  new: number;
  updated: number;
  unchanged: number;
}

function compareSpells(
  uploaded: SpellSchool["spells"],
  existing: SpellSchool["spells"]
): boolean {
  if (uploaded.length !== existing.length) return false;

  const sort = (spells: SpellSchool["spells"]) =>
    [...spells].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

  const sortedUploaded = sort(uploaded);
  const sortedExisting = sort(existing);

  return sortedUploaded.every((u, i) => {
    const e = sortedExisting[i];
    return (
      u.name === e.name &&
      u.tier === e.tier &&
      u.actions === e.actions &&
      u.reaction === e.reaction &&
      (u.damage ?? "") === (e.damage ?? "") &&
      (u.description ?? "") === (e.description ?? "") &&
      (u.highLevels ?? "") === (e.highLevels ?? "") &&
      (u.concentration ?? "") === (e.concentration ?? "") &&
      (u.upcast ?? "") === (e.upcast ?? "")
    );
  });
}

export function compareSpellSchools(
  uploaded: SpellSchool,
  existing: SpellSchool | null
): DiffStatus {
  if (!existing) return "new";

  if (uploaded.name !== existing.name) return "updated";
  if ((uploaded.description ?? "") !== (existing.description ?? ""))
    return "updated";
  if (!compareSpells(uploaded.spells, existing.spells)) return "updated";

  return "unchanged";
}

export function computeDiffCounts(items: SpellSchoolWithDiff[]): DiffCounts {
  return items.reduce(
    (acc, { status }) => {
      acc[status]++;
      return acc;
    },
    { new: 0, updated: 0, unchanged: 0 }
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Collection } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseMonsterLevel(level: string): number {
  if (level.includes("/")) {
    const [numerator, denominator] = level.split("/").map(Number);
    return numerator / denominator;
  }
  return Number(level);
}

export function sortMonstersInCollections(
  collections: Collection[]
): Collection[] {
  return collections.map((collection) => ({
    ...collection,
    monsters: collection.monsters?.sort(
      (a, b) => parseMonsterLevel(a.level) - parseMonsterLevel(b.level)
    ),
  }));
}

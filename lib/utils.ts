import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Monster } from "./types";

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

export function monstersSortedByLevel(monsters: Monster[]): Monster[] {
  return monsters?.sort(
    (a, b) => parseMonsterLevel(a.level) - parseMonsterLevel(b.level)
  );
}

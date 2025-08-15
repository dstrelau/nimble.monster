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

export function monstersSortedByLevel<T extends { level: string }>(
  monsters: T[]
): T[] {
  return monsters?.sort(
    (a, b) => parseMonsterLevel(a.level) - parseMonsterLevel(b.level)
  );
}

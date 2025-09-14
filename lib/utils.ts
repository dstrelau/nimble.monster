import { type ClassValue, clsx } from "clsx";
import { Roboto, Roboto_Condensed, Roboto_Slab } from "next/font/google";
import { twMerge } from "tailwind-merge";

export const sans = Roboto({ style: ["normal", "italic"] });
export const slab = Roboto_Slab();
export const condensed = Roboto_Condensed({ style: ["normal", "italic"] });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function levelIntToDisplay(levelInt: number): string {
  switch (levelInt) {
    case -4:
      return "1/4";
    case -3:
      return "1/3";
    case -2:
      return "1/2";
    case 0:
      return "";
    default:
      return levelInt > 0 ? levelInt.toString() : "";
  }
}

export function stringToLevelInt(level: string): number {
  switch (level) {
    case "1/4":
      return -4;
    case "1/3":
      return -3;
    case "1/2":
      return -2;
    default: {
      const parsed = parseInt(level, 10);
      return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 20 ? parsed : 0;
    }
  }
}

export function monstersSortedByLevelInt<T extends { levelInt: number }>(
  monsters: T[]
): T[] {
  return monsters?.slice().sort((a, b) => a.levelInt - b.levelInt);
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "common":
      return "bg-gray-100 text-gray-800";
    case "uncommon":
      return "bg-green-100 text-green-800";
    case "rare":
      return "bg-blue-100 text-blue-800";
    case "very_rare":
      return "bg-purple-100 text-purple-800";
    case "legendary":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function levelIntToDisplay(levelInt: number): string {
  switch (levelInt) {
    case 30:
      return "30+";
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

export function monstersSortedByLevelInt<T extends { levelInt: number }>(
  monsters: T[]
): T[] {
  return monsters?.slice().sort((a, b) => a.levelInt - b.levelInt);
}

export function itemsSortedByName<T extends { name: string }>(items: T[]): T[] {
  return items?.slice().sort((a, b) => a.name.localeCompare(b.name));
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

type Curry<P extends unknown[], R> = <T extends unknown[]>(
  ...args: T
) => T extends [...P]
  ? R
  : T extends [...infer T1]
    ? T1 extends [...P]
      ? never
      : Curry<[...{ [K in keyof P]: K extends keyof T1 ? never : P[K] }], R>
    : never;

export function curry<P extends unknown[], R>(
  fn: (...args: P) => R
): Curry<P, R> {
  const curried = (...args: unknown[]): unknown => {
    if (args.length >= fn.length) {
      return fn(...(args as P));
    }
    return curry((fn as (...allArgs: unknown[]) => R).bind(null, ...args));
  };
  return curried as Curry<P, R>;
}

import { type AdventureCounts, getAdventureCounts } from "./adventures";
import { type BestiaryCounts, getBestiaryCounts } from "./bestiary";
import {
  type CharacterOptionCounts,
  getCharacterOptionCounts,
} from "./character-options";
import { getRuleCounts, type RuleCounts } from "./custom-rule";
import { type GearCounts, getGearCounts } from "./gear";
import { getRandomTableCounts, type RandomTableCounts } from "./random-table";

export type AllNavCounts = BestiaryCounts &
  CharacterOptionCounts &
  GearCounts &
  AdventureCounts &
  RuleCounts &
  RandomTableCounts;

export async function getNavCounts(): Promise<AllNavCounts> {
  const [bestiary, characterOptions, gear, adventures, rules, randomTables] =
    await Promise.all([
      getBestiaryCounts(),
      getCharacterOptionCounts(),
      getGearCounts(),
      getAdventureCounts(),
      getRuleCounts(),
      getRandomTableCounts(),
    ]);
  return {
    ...bestiary,
    ...characterOptions,
    ...gear,
    ...adventures,
    ...rules,
    ...randomTables,
  };
}

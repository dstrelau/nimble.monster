"use server";

import * as db from "@/lib/db";

export async function getNavCountsAction() {
  const [bestiary, characterOptions, gear, adventures, rules, randomTables] =
    await Promise.all([
      db.getBestiaryCounts(),
      db.getCharacterOptionCounts(),
      db.getGearCounts(),
      db.getAdventureCounts(),
      db.getRuleCounts(),
      db.getRandomTableCounts(),
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

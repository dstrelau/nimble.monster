"use server";

import * as db from "@/lib/db";

export async function getNavCountsAction() {
  const [bestiary, characterOptions, gear, adventures, rules] =
    await Promise.all([
      db.getBestiaryCounts(),
      db.getCharacterOptionCounts(),
      db.getGearCounts(),
      db.getAdventureCounts(),
      db.getRuleCounts(),
    ]);
  return {
    ...bestiary,
    ...characterOptions,
    ...gear,
    ...adventures,
    ...rules,
  };
}

"use server";

import * as db from "@/lib/db";

export async function getNavCountsAction() {
  const [bestiary, characterOptions, gear, adventures] = await Promise.all([
    db.getBestiaryCounts(),
    db.getCharacterOptionCounts(),
    db.getGearCounts(),
    db.getAdventureCounts(),
  ]);
  return { ...bestiary, ...characterOptions, ...gear, ...adventures };
}

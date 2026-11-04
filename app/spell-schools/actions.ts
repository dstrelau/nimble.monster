"use server";

import * as db from "@/lib/db";

export async function listPublicSpellSchoolsAction() {
  return db.listPublicSpellSchools();
}

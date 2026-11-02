"use server";

import * as db from "@/lib/db";

export async function listPublicClassesAction() {
  return db.listPublicClasses();
}

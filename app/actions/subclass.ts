"use server";

import * as db from "@/lib/db";

export async function listPublicSubclassesAction() {
  return db.listPublicSubclasses();
}

"use server";

import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function searchClassesForSubclass(searchTerm?: string) {
  const session = await auth();
  const classes = await db.searchClassesForSubclass({
    userId: session?.user?.id,
    searchTerm,
  });
  return classes;
}

export async function listPublicClassesAction() {
  return db.listPublicClasses();
}

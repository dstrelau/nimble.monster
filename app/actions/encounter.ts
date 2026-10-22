"use server";

import { unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function listOwnEncounters() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const encounters = await db.listEncountersWithMonstersForUser(
    session.user.discordId
  );
  return { success: true, encounters };
}

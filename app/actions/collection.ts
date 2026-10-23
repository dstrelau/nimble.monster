"use server";

import { unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function listOwnCollections() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const collections = await db.listCollectionsWithMonstersForUser(
    session.user.discordId
  );
  return { success: true, collections };
}

"use server";

import { topItemCreators } from "@/lib/db/user";

export async function getTopItemCreators() {
  return topItemCreators(10);
}

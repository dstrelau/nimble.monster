"use server";

import { searchUsers, topItemCreators } from "@/lib/db/user";

export async function searchCreators(query: string) {
  return searchUsers(query, 20);
}

export async function getTopItemCreators() {
  return topItemCreators(10);
}

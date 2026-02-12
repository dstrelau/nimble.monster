"use server";

import {
  searchUsers,
  topItemCreators,
  topMonsterCreators,
} from "@/lib/db/user";

export async function searchCreators(query: string) {
  return searchUsers(query, 20);
}

export async function getTopMonsterCreators() {
  return topMonsterCreators(10);
}

export async function getTopItemCreators() {
  return topItemCreators(10);
}

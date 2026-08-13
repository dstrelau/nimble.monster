"use server";

import {
  searchUsers,
  topItemCreators,
  topMonsterCreators,
} from "@/lib/db/user";
import { topGlobalSearchCreators } from "@/lib/services/global-search/creators";

export async function searchCreators(query: string) {
  return searchUsers(query, 20);
}

export async function getTopMonsterCreators() {
  return topMonsterCreators(10);
}

export async function getTopItemCreators() {
  return topItemCreators(10);
}

export async function getTopGlobalSearchCreators() {
  return topGlobalSearchCreators(10);
}

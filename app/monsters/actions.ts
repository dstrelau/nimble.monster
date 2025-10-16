"use server";
import { listAllSources } from "@/lib/db/source";

export async function listAllMonsterSources() {
  return listAllSources();
}

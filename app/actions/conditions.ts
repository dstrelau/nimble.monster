"use server";
import { listOfficialConditions } from "@/lib/db/condition";
import type { Condition } from "@/lib/types";

export async function loadOfficialConditions(): Promise<Condition[]> {
  return await listOfficialConditions();
}

"use client";

import type { Family } from "@/lib/types";
import { getUserFamilies as getUserFamiliesAction } from "./family";

// Client wrapper for getUserFamilies server action
export async function getUserFamilies(): Promise<{
  success: boolean;
  families: Family[];
  error: string | null;
}> {
  return getUserFamiliesAction();
}

"use client";

import { getUserFamilies as getUserFamiliesAction } from "./family";
import { Family } from "@/lib/types";

// Client wrapper for getUserFamilies server action
export async function getUserFamilies(): Promise<{ 
  success: boolean; 
  families: Family[];
  error: string | null;
}> {
  return getUserFamiliesAction();
}
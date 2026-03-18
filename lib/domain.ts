import { headers } from "next/headers";

export const OFFICIAL_ONLY_DOMAIN = "nimblenomi.com";
export const OFFICIAL_ONLY_HEADER = "x-official-only";

export async function isOfficialOnlyDomain(): Promise<boolean> {
  if (process.env.FORCE_OFFICIAL_ONLY === "1") return true;
  const h = await headers();
  return h.get(OFFICIAL_ONLY_HEADER) === "1";
}

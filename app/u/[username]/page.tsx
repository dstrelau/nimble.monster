import { redirect } from "next/navigation";
import { MY_LIBRARY_ITEMS } from "@/lib/types/entity-links";

interface UserProfileRedirectPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UserProfileRedirectPage({
  params,
  searchParams,
}: UserProfileRedirectPageProps) {
  const { username } = await params;
  const rawSearchParams = await searchParams;
  const requestedTab = rawSearchParams.tab;
  const entityType =
    typeof requestedTab === "string" &&
    MY_LIBRARY_ITEMS.some((item) => item.key === requestedTab)
      ? requestedTab
      : "monsters";
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (key === "tab" || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) nextSearchParams.append(key, entry);
    } else {
      nextSearchParams.set(key, value);
    }
  }

  const query = nextSearchParams.size > 0 ? `?${nextSearchParams}` : "";
  redirect(`/u/${encodeURIComponent(username)}/${entityType}${query}`);
}

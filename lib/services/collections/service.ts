import { z } from "zod";
import type { CollectionOverview } from "@/lib/types";
import { searchPublicCollections } from "./queries";

export const PublicCollectionPageSchema = z.object({
  search: z.string().nullish(),
  sort: z
    .enum(["name", "-name", "createdAt", "-createdAt"])
    .default("-createdAt"),
  limit: z.number().int().min(1).max(100).default(12),
  pageParam: z
    .number()
    .int()
    .min(0)
    .max(Math.floor(Number.MAX_SAFE_INTEGER / 100))
    .default(0),
});

export interface PublicCollectionPageResponse {
  data: CollectionOverview[];
  hasMore: boolean;
}

export async function publicCollectionPage(
  params: Omit<z.input<typeof PublicCollectionPageSchema>, "sort"> & {
    sort?: string;
  }
): Promise<PublicCollectionPageResponse> {
  const parsed = PublicCollectionPageSchema.parse(params);
  const descending = parsed.sort.startsWith("-");
  const field = descending ? parsed.sort.slice(1) : parsed.sort;
  const data = await searchPublicCollections({
    searchTerm: parsed.search || undefined,
    sortBy: field === "name" ? "name" : "createdAt",
    sortDirection: descending ? "desc" : "asc",
    limit: parsed.limit + 1,
    offset: parsed.pageParam * parsed.limit,
  });
  return {
    data: data.slice(0, parsed.limit),
    hasMore: data.length > parsed.limit,
  };
}

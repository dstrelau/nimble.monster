import { z } from "zod";
import type { EncounterOverview } from "@/lib/types";
import {
  type EncounterSortBy,
  type EncounterSortDirection,
  searchEncountersForCreator,
  searchPublicEncounters,
} from "./repository";

export const MyEncountersPageSchema = z.object({
  sort: z
    .enum(["name", "-name", "createdAt", "-createdAt"])
    .default("-createdAt"),
  search: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(12),
  pageParam: z
    .number()
    .int()
    .min(0)
    .max(Math.floor(Number.MAX_SAFE_INTEGER / 100))
    .default(0),
});

export interface MyEncountersParams {
  sort?: string;
  search?: string | null;
  limit?: number;
  pageParam?: number;
}

export const PublicEncountersPageSchema = MyEncountersPageSchema.extend({
  creatorId: z.string().optional(),
});

export interface PublicEncountersParams extends MyEncountersParams {
  creatorId?: string;
}

export interface PaginatedEncounterResponse {
  data: EncounterOverview[];
  hasMore: boolean;
}

export function parseEncounterSort(sort: string): {
  sortBy: EncounterSortBy;
  sortDirection: EncounterSortDirection;
} {
  const desc = sort?.startsWith("-");
  const sortField = desc ? sort.slice(1) : sort;
  return {
    sortBy: sortField === "name" ? "name" : "createdAt",
    sortDirection: desc ? "desc" : "asc",
  };
}

export async function paginatePublicEncounters(
  input: PublicEncountersParams = {}
): Promise<PaginatedEncounterResponse> {
  const params = PublicEncountersPageSchema.parse(input);
  const data = await searchPublicEncounters({
    ...parseEncounterSort(params.sort),
    searchTerm: params.search || undefined,
    limit: params.limit + 1,
    offset: params.pageParam * params.limit,
    creatorId: params.creatorId,
  });
  return {
    data: data.slice(0, params.limit),
    hasMore: data.length > params.limit,
  };
}

/** Identity must come from the authenticated session, never request filters. */
export async function paginateMyEncounters(
  creatorId: string,
  input: MyEncountersParams = {}
): Promise<PaginatedEncounterResponse> {
  const params = MyEncountersPageSchema.parse(input);
  const data = await searchEncountersForCreator({
    ...parseEncounterSort(params.sort),
    searchTerm: params.search || undefined,
    limit: params.limit + 1,
    offset: params.pageParam * params.limit,
    creatorId,
  });
  return {
    data: data.slice(0, params.limit),
    hasMore: data.length > params.limit,
  };
}

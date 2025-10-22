import type { Companion, SubclassClass } from "@/lib/types";

export const CompanionClassOptions = ["all"] as const;

export type CompanionClassOption =
  | (typeof CompanionClassOptions)[number]
  | SubclassClass;

export const PaginateCompanionsSortOptions = [
  "name",
  "-name",
  "createdAt",
  "-createdAt",
] as const;

export type PaginateCompanionsSortOption =
  (typeof PaginateCompanionsSortOptions)[number];

export interface PaginateMonstersParams {
  cursor?: string;
  limit?: number;
  sort?: PaginateCompanionsSortOption;
  search?: string;
  class?: CompanionClassOption;
  creatorId?: string;
}

export interface PaginatePublicCompanionsResponse {
  data: Companion[];
  nextCursor: string | null;
}

import type { Award, Source, User } from "@/lib/types/base";

export interface BackgroundMini {
  id: string;
  name: string;
  requirement?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Background extends BackgroundMini {
  description: string;
  creator: User;
  source?: Source;
  awards?: Award[];
}

export type BackgroundSortBy = "name" | "createdAt";
export type BackgroundSortDirection = "asc" | "desc";

export const PaginateBackgroundsSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

export type PaginateBackgroundsSortOption =
  (typeof PaginateBackgroundsSortOptions)[number];

export interface PaginateBackgroundsParams {
  search?: string;
  sort?: PaginateBackgroundsSortOption;
  limit?: number;
  cursor?: string;
  creatorId?: string;
  sourceId?: string;
}

export interface PaginatePublicBackgroundsResponse {
  data: Background[];
  nextCursor: string | null;
}

export interface SearchBackgroundsParams {
  searchTerm?: string;
  creatorId?: string;
  sourceId?: string;
  sortBy?: BackgroundSortBy;
  sortDirection?: BackgroundSortDirection;
  limit?: number;
}

export interface CreateBackgroundInput {
  name: string;
  description: string;
  requirement?: string;
  sourceId?: string;
}

export interface UpdateBackgroundInput {
  name: string;
  description: string;
  requirement?: string;
  sourceId?: string;
}

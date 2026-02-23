import type { Award, Source, User } from "@/lib/types";

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

export interface SearchBackgroundsParams {
  searchTerm?: string;
  creatorId?: string;
  source?: string;
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

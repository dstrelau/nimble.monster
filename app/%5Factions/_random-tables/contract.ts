import { defineRoute } from "@/lib/contract";
import type { RandomTableFormData } from "@/lib/random-table-schema";
import type { RandomTable } from "@/lib/types";

export type SaveRandomTableInput = RandomTableFormData & { id?: string };

export interface RandomTableMutationResult {
  id: string;
  name: string;
}

export type RandomTableSortOption =
  | "name"
  | "-name"
  | "createdAt"
  | "-createdAt";

export interface SearchRandomTablesInput {
  sort: RandomTableSortOption;
  search: string | null;
  limit: number;
  page: number;
}

export type SerializedRandomTable = Omit<RandomTable, "createdAt"> & {
  createdAt?: string;
};

export interface SearchRandomTablesResult {
  data: SerializedRandomTable[];
}

export const saveRandomTable = defineRoute<
  SaveRandomTableInput,
  RandomTableMutationResult
>({
  method: "POST",
  path: () => "/_actions/saveRandomTable",
});

export const deleteRandomTable = defineRoute<{ id: string }, { success: true }>(
  {
    method: "POST",
    path: () => "/_actions/deleteRandomTable",
  }
);

export const searchRandomTables = defineRoute<
  SearchRandomTablesInput,
  SearchRandomTablesResult
>({
  method: "POST",
  path: () => "/_actions/searchRandomTables",
});

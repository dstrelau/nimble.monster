import { z } from "zod";
import * as repository from "./repository";
import type { ClassAbilityList } from "./types";

const PaginateClassAbilityListsSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

const PaginateClassAbilityListsSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateClassAbilityListsSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  creatorId: z.string().optional(),
  characterClass: z.string().optional(),
});

export type PaginateClassAbilityListsParams = z.infer<
  typeof PaginateClassAbilityListsSchema
>;

export type PaginateClassAbilityListsResponse = {
  data: ClassAbilityList[];
  nextCursor: string | null;
};

export class ClassAbilityListsService {
  async paginatePublicClassAbilityLists(
    params: PaginateClassAbilityListsParams
  ): Promise<PaginateClassAbilityListsResponse> {
    const parsedParams = PaginateClassAbilityListsSchema.parse(params);
    return repository.paginatePublicClassAbilityLists(parsedParams);
  }
}

export const classAbilityListsService = new ClassAbilityListsService();

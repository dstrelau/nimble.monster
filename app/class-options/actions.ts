"use server";

import { classAbilityListsService } from "@/lib/services/classAbilityLists";
import type { PaginateClassAbilityListsParams } from "@/lib/services/classAbilityLists/service";

export const paginatePublicClassAbilityLists = async (
  params: PaginateClassAbilityListsParams
) => {
  return classAbilityListsService.paginatePublicClassAbilityLists(params);
};

"use server";

import {
  type PaginateHazardsParams,
  paginatePublicHazards,
} from "@/lib/services/hazards";

export const paginateUserProfileHazards = async (
  params: PaginateHazardsParams
) => paginatePublicHazards(params);

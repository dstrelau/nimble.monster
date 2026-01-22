import type {
  PaginateMonstersParams,
  PaginatePublicCompanionsResponse,
} from "./types";

export const paginatePublicCompanions = async (
  _params: PaginateMonstersParams
): Promise<PaginatePublicCompanionsResponse> => {
  return {
    data: [],
    nextCursor: null,
  };
};

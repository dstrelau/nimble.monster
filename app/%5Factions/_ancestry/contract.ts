import { defineRoute } from "@/lib/contract";
import type {
  CreateAncestryInput,
  UpdateAncestryInput,
} from "@/lib/services/ancestries/types";

export interface AncestryMutationResult {
  id: string;
  name: string;
}

export interface UpdateAncestryRequest {
  id: string;
  input: UpdateAncestryInput;
}

export const createAncestry = defineRoute<
  CreateAncestryInput,
  AncestryMutationResult
>({
  method: "POST",
  path: () => "/_actions/createAncestry",
});

export const updateAncestry = defineRoute<
  UpdateAncestryRequest,
  AncestryMutationResult
>({
  method: "POST",
  path: () => "/_actions/updateAncestry",
});

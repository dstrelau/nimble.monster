import { defineRoute } from "@/lib/contract";
import type { CreateFamilyInput } from "@/lib/db/family";

export type FamilySaveInput = Omit<CreateFamilyInput, "discordId">;

export interface FamilyMutationResult {
  id: string;
  name: string;
}

export interface UpdateFamilyRequest {
  id: string;
  input: FamilySaveInput;
}

export const createFamily = defineRoute<FamilySaveInput, FamilyMutationResult>({
  method: "POST",
  path: () => "/_actions/createFamily",
});

export const updateFamily = defineRoute<
  UpdateFamilyRequest,
  FamilyMutationResult
>({
  method: "POST",
  path: () => "/_actions/updateFamily",
});

import { defineRoute } from "@/lib/contract";
import type { CreateCompanionInput } from "@/lib/db/companion";

export type CompanionSaveInput = Omit<CreateCompanionInput, "discordId">;

export interface CompanionMutationResult {
  id: string;
  name: string;
}

export interface UpdateCompanionRequest {
  id: string;
  input: CompanionSaveInput;
}

export const createCompanion = defineRoute<
  CompanionSaveInput,
  CompanionMutationResult
>({ method: "POST", path: () => "/_actions/createCompanion" });

export const updateCompanion = defineRoute<
  UpdateCompanionRequest,
  CompanionMutationResult
>({ method: "POST", path: () => "/_actions/updateCompanion" });

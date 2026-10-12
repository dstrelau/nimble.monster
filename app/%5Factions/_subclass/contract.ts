import { defineRoute } from "@/lib/contract";
import type { CreateSubclassInput } from "@/lib/db/subclass";

export type SubclassSaveInput = Omit<
  CreateSubclassInput,
  "discordId" | "sourceId" | "abilityListIds"
>;

export interface SubclassMutationResult {
  id: string;
  name: string;
  namePreface?: string;
}

export interface UpdateSubclassRequest {
  id: string;
  input: SubclassSaveInput;
}

export const createSubclass = defineRoute<
  SubclassSaveInput,
  SubclassMutationResult
>({
  method: "POST",
  path: () => "/_actions/createSubclass",
});

export const updateSubclass = defineRoute<
  UpdateSubclassRequest,
  SubclassMutationResult
>({
  method: "POST",
  path: () => "/_actions/updateSubclass",
});

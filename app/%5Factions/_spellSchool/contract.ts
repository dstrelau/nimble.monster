import type { z } from "zod";
import { defineRoute } from "@/lib/contract";
import type { spellSchoolInputSchema } from "./input";

export type SpellSchoolSaveInput = z.infer<typeof spellSchoolInputSchema>;

export interface SpellSchoolMutationResult {
  id: string;
  name: string;
}

export interface UpdateSpellSchoolRequest {
  id: string;
  input: SpellSchoolSaveInput;
}

export const createSpellSchool = defineRoute<
  SpellSchoolSaveInput,
  SpellSchoolMutationResult
>({ method: "POST", path: () => "/_actions/createSpellSchool" });

export const updateSpellSchool = defineRoute<
  UpdateSpellSchoolRequest,
  SpellSchoolMutationResult
>({ method: "POST", path: () => "/_actions/updateSpellSchool" });

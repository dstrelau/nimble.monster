import type { z } from "zod";
import { defineRoute } from "@/lib/contract";
import type { customRuleInputSchema } from "./input";

export type CustomRuleSaveInput = z.infer<typeof customRuleInputSchema>;

export interface CustomRuleMutationResult {
  id: string;
  name: string;
}

export interface UpdateCustomRuleRequest {
  id: string;
  input: CustomRuleSaveInput;
}

export const createCustomRule = defineRoute<
  CustomRuleSaveInput,
  CustomRuleMutationResult
>({ method: "POST", path: () => "/_actions/createCustomRule" });

export const updateCustomRule = defineRoute<
  UpdateCustomRuleRequest,
  CustomRuleMutationResult
>({ method: "POST", path: () => "/_actions/updateCustomRule" });

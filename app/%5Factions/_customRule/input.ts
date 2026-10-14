import { z } from "zod";
import { isValidUUID } from "@/lib/utils/validation";

export const customRuleInputSchema = z.object({
  name: z.string().trim().min(1, "Custom rule name is required"),
  content: z.string(),
  keywords: z.string(),
  visibility: z.enum(["public", "private"]),
  links: z.array(
    z.object({
      ruleSlug: z.string(),
      relation: z.enum(["augments", "replaces"]),
    })
  ),
});

export const updateCustomRuleSchema = z.object({
  id: z.string().refine(isValidUUID, "Invalid custom rule ID"),
  input: customRuleInputSchema,
});

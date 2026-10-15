import { z } from "zod";
import { attackMetadataSchema } from "@/lib/types/attack";
import { isValidUUID } from "@/lib/utils/validation";

const abilitySchema = attackMetadataSchema.safeExtend({
  id: z.string().optional(),
  name: z.string().min(1, "Ability name is required"),
  description: z.string().min(1, "Ability description is required"),
});

export const FamilySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  description: z.string().optional(),
  abilities: z.array(abilitySchema).min(1, "At least one ability is required"),
});

export const familyInputSchema = FamilySchema.extend({
  abilities: z
    .array(abilitySchema.safeExtend({ id: z.string() }))
    .min(1, "At least one ability is required"),
});

export const updateFamilySchema = z.object({
  id: z.string().refine(isValidUUID, "Invalid family ID"),
  input: familyInputSchema,
});

import { z } from "zod";
import { RARITIES, SIZES } from "@/lib/services/ancestries/types";
import { isValidUUID } from "@/lib/utils/validation";

const uuid = z.string().refine(isValidUUID, "Invalid UUID");

export const ancestryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  size: z
    .array(z.enum(SIZES.map(({ value }) => value)))
    .min(1, "At least one size is required"),
  rarity: z.enum(RARITIES.map(({ value }) => value)),
  visibility: z.enum(["public", "private"]).optional(),
  abilities: z.array(
    z.object({
      name: z.string().trim().min(1, "Ability name is required"),
      description: z.string().trim().min(1, "Ability description is required"),
    })
  ),
  sourceId: uuid.optional(),
});

export const updateAncestrySchema = z.object({
  id: uuid,
  input: ancestryInputSchema,
});

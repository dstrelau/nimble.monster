import { z } from "zod";
import { SIZES } from "@/lib/services/monsters/types";
import { isValidUUID } from "@/lib/utils/validation";

export const companionInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  kind: z.string(),
  class: z.string(),
  hp_per_level: z.string(),
  wounds: z.number().min(1),
  size: z.enum(SIZES.map(({ value }) => value)),
  saves: z.string(),
  actions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      damage: z.string().optional(),
      range: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  abilities: z.array(
    z.strictObject({
      id: z.string(),
      name: z.string(),
      description: z.string(),
    })
  ),
  actionPreface: z.string(),
  dyingRule: z.string(),
  moreInfo: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  paperforgeId: z.string().optional(),
});

export const updateCompanionSchema = z.object({
  id: z.string().refine(isValidUUID, "Invalid companion ID"),
  input: companionInputSchema,
});

import { z } from "zod";

export const spellInputSchema = z.object({
  name: z.string().min(1, "Spell name is required"),
  tier: z.number().min(0).max(9),
  version: z.number().int().min(2).max(3).optional(),
  actions: z.number().min(0).max(10),
  reaction: z.boolean(),
  utility: z.boolean(),
  target: z
    .union([
      z.object({ type: z.literal("self") }),
      z.object({
        type: z.enum(["single", "single+", "multi", "special"]),
        kind: z.enum(["range", "reach"]),
        distance: z.number().min(0).optional(),
      }),
      z.object({
        type: z.literal("aoe"),
        kind: z.enum(["range", "reach", "line", "cone"]),
        distance: z.number().min(0).optional(),
      }),
    ])
    .optional(),
  damage: z.string().optional(),
  description: z.string().optional(),
  highLevels: z.string().optional(),
  concentration: z.string().optional(),
  upcast: z.string().optional(),
});

export const spellSchoolInputSchema = z.object({
  name: z.string().min(1, "School name is required"),
  description: z.string().optional(),
  spells: z.array(spellInputSchema),
  visibility: z.enum(["public", "private"]),
});

export const updateSpellSchoolSchema = z.object({
  id: z.uuid(),
  input: spellSchoolInputSchema,
});

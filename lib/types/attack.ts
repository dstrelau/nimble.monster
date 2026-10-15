import { z } from "zod";

// Distances use Nimble spaces. Lines are always one space wide.
export const attackTargetSchema = z.union([
  z.object({ reach: z.number().int().positive() }).strict(),
  z.object({ range: z.number().int().positive() }).strict(),
  z.object({ aura: z.number().int().positive() }).strict(),
]);

export const attackAreaSchema = z.discriminatedUnion("shape", [
  z
    .object({ shape: z.literal("square"), size: z.number().int().positive() })
    .strict(),
  z
    .object({ shape: z.literal("cone"), size: z.number().int().positive() })
    .strict(),
  z
    .object({
      shape: z.literal("line"),
      size: z.number().int().positive(),
    })
    .strict(),
]);

export const attackMetadataSchema = z
  .object({
    target: attackTargetSchema.optional(),
    area: attackAreaSchema.optional(),
    aoe: z.boolean().optional(),
    attackCount: z.number().int().positive().optional(),
    // An inline "or Shoot/Spit" shares the primary attack's damage and count;
    // its range belongs to the alternative, not to the melee attack.
    alternative: z
      .object({
        name: z.string().min(1),
        target: attackTargetSchema,
      })
      .strict()
      .optional(),
  })
  .refine(
    ({ target, area }) =>
      !(target && "range" in target && area?.shape === "cone"),
    { message: "A cone cannot also have a ranged target", path: ["target"] }
  )
  .refine(({ area, aoe }) => !(area && aoe), {
    message: "Use either a shaped area or unsized AoE, not both",
    path: ["aoe"],
  });

export type AttackMetadata = z.infer<typeof attackMetadataSchema>;

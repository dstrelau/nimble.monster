import { z } from "zod";

export const awardInputSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  description: z.string().default(""),
  url: z.url(),
  color: z.string().min(1),
  icon: z.string().min(1),
});

export const awardIdSchema = z.string().min(1);

export const awardAssociationSchema = z.object({
  entityType: z.enum([
    "monster",
    "item",
    "companion",
    "subclass",
    "school",
    "ancestry",
    "background",
  ]),
  entityId: z.string().min(1),
  awardId: awardIdSchema,
});

export const duplicateAwardError = {
  error: "An award with this abbreviation already exists",
};

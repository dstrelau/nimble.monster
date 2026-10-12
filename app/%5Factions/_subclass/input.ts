import { z } from "zod";
import { isValidUUID } from "@/lib/utils/validation";

const uuid = z.string().refine(isValidUUID, "Invalid UUID");
const name = z.string().trim().min(1, "Name is required");

export const subclassInputSchema = z.object({
  name,
  classId: uuid.nullable().optional(),
  className: z.string().trim().min(1, "Class is required"),
  namePreface: z.string().trim().optional(),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  levels: z.array(
    z.object({
      level: z.number(),
      abilities: z.array(
        z.object({
          // Example abilities use descriptive IDs; persistence generates fresh UUIDs.
          id: z.string().min(1),
          name,
          description: z
            .string()
            .trim()
            .min(1, "Ability description is required"),
        })
      ),
    })
  ),
  abilityLists: z
    .array(
      z.object({
        name,
        description: z.string(),
        items: z
          .array(z.object({ name, description: z.string() }))
          .min(1, "At least one option is required"),
      })
    )
    .optional(),
  visibility: z.enum(["public", "private"]),
});

export const updateSubclassSchema = z.object({
  id: uuid,
  input: subclassInputSchema,
});

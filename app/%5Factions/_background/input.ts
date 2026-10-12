import { z } from "zod";
import { isValidUUID } from "@/lib/utils/validation";

const uuid = z.string().refine(isValidUUID, "Invalid UUID");

export const backgroundInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  requirement: z.string().trim().optional(),
  sourceId: uuid.optional(),
});

export const updateBackgroundSchema = z.object({
  id: uuid,
  input: backgroundInputSchema,
});

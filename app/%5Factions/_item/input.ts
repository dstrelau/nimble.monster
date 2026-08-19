import { z } from "zod";
import { RARITIES } from "@/lib/services/items";
import { isValidUUID } from "@/lib/utils/validation";

const uuid = z.string().refine(isValidUUID, "Invalid UUID");

export const itemInputSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  kind: z.string().optional(),
  description: z.string(),
  moreInfo: z.string().optional(),
  imageIcon: z.string().optional(),
  imageBgIcon: z.string().optional(),
  imageColor: z.string().optional(),
  imageBgColor: z.string().optional(),
  imageBackdrop: z.string().optional(),
  rarity: z.enum(RARITIES.map(({ value }) => value)).optional(),
  visibility: z.enum(["public", "private"]),
  sourceId: uuid.optional(),
});

export const createItemSchema = itemInputSchema.extend({
  remixedFromId: uuid.optional(),
});

export const updateItemSchema = z.object({
  id: uuid,
  input: itemInputSchema,
});

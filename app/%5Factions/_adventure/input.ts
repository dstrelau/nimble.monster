import { z } from "zod";

export const adventureInputSchema = z.object({
  name: z.string().max(200),
  tagline: z.string().max(300),
  summary: z.string().max(2000),
  visibility: z.enum(["public", "private"]),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        parentId: z.string().min(1).max(100).nullable(),
        kind: z.enum([
          "section",
          "text",
          "callout",
          "image",
          "encounter",
          "statblock",
        ]),
        orderIndex: z.number().int().min(0),
        title: z.string().max(300),
        content: z.string().max(50_000),
        encounterId: z.string().uuid().nullable(),
        monsterId: z.string().uuid().nullable(),
        itemId: z.string().uuid().nullable(),
        imageId: z.string().uuid().nullable().optional(),
        imageExtension: z.enum(["jpg", "png", "webp"]).nullable().optional(),
        caption: z.string().max(500).optional(),
        presentation: z
          .enum(["note", "tip", "warning", "rules", "read-aloud", "optional"])
          .nullable(),
      })
    )
    .max(200),
});

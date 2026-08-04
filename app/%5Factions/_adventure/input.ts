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
        kind: z.enum(["section", "text", "callout", "encounter", "statblock"]),
        orderIndex: z.number().int().min(0),
        title: z.string().max(300),
        content: z.string().max(50_000),
        encounterId: z.string().uuid().nullable(),
        monsterId: z.string().uuid().nullable(),
        itemId: z.string().uuid().nullable(),
        presentation: z.enum(["note", "tip", "warning", "rules"]).nullable(),
      })
    )
    .max(200),
});

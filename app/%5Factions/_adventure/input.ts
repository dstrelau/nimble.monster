import { z } from "zod";

export const adventureInputSchema = z.object({
  name: z.string().max(200),
  tagline: z.string().max(300),
  summary: z.string().max(2000),
  visibility: z.enum(["public", "private"]),
  nodes: z
    .array(
      z
        .object({
          id: z.string().min(1).max(100),
          parentId: z.string().min(1).max(100).nullable(),
          kind: z.enum([
            "section",
            "text",
            "callout",
            "image",
            "encounter",
            "monsters",
            "items",
          ]),
          orderIndex: z.number().int().min(0),
          title: z.string().max(300),
          content: z.string().max(50_000),
          encounterId: z.string().uuid().nullable(),
          monsterIds: z.array(z.string().uuid()).max(10),
          itemIds: z.array(z.string().uuid()).max(10),
          missingStatblockCount: z.number().int().min(0).max(10),
          imageId: z.string().uuid().nullable().optional(),
          imageExtension: z.enum(["jpg", "png", "webp"]).nullable().optional(),
          caption: z.string().max(500).optional(),
          presentation: z
            .enum(["note", "tip", "warning", "rules", "read-aloud", "optional"])
            .nullable(),
        })
        .superRefine((node, context) => {
          const count =
            (node.kind === "monsters" ? node.monsterIds.length : 0) +
            (node.kind === "items" ? node.itemIds.length : 0) +
            node.missingStatblockCount;
          if (count > 10) {
            context.addIssue({
              code: "custom",
              message: "Statblock groups may contain at most 10 references",
            });
          }
        })
    )
    .max(200),
});

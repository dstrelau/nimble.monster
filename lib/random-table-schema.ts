import { z } from "zod";
import { parseTableNotation, tableNotationRange } from "@/lib/dice";
import { ValidCollectionVisibilities } from "@/lib/types";

export const SubtableRowSchema = z.object({
  low: z.number({ error: "Enter a number" }).int(),
  high: z.number({ error: "Enter a number" }).int(),
  result: z.string().min(1, "Result is required"),
});

export const SubtableSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    notation: z.string().min(1, "Dice notation is required"),
    rows: z.array(SubtableRowSchema).min(1, "At least one row is required"),
  })
  .superRefine((subtable, ctx) => {
    const roll = parseTableNotation(subtable.notation);
    if (!roll) {
      ctx.addIssue({
        code: "custom",
        path: ["notation"],
        message: "Not a valid die roll (e.g. 1d6, 2d12, d66)",
      });
      return;
    }

    const { min, max } = tableNotationRange(roll);
    subtable.rows.forEach((row, index) => {
      if (row.high < row.low) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", index, "high"],
          message: "Must not be less than the low value",
        });
      }
      if (row.low < min || row.high > max) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", index, "low"],
          message: `${subtable.notation} rolls ${min}–${max}`,
        });
      }
    });
  });

export const RandomTableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(ValidCollectionVisibilities),
  subtables: z.array(SubtableSchema).min(1, "At least one table is required"),
});

export type RandomTableFormData = z.infer<typeof RandomTableSchema>;

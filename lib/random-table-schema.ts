import { z } from "zod";
import { ValidCollectionVisibilities } from "@/lib/types";

export const SubtableColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Column name is required"),
});

export const SubtableRowSchema = z.object({
  cells: z.record(z.string(), z.string()),
});

export const SubtableSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    columns: z
      .array(SubtableColumnSchema)
      .min(1, "At least one column is required"),
    rows: z.array(SubtableRowSchema).min(1, "At least one row is required"),
  })
  .superRefine((subtable, ctx) => {
    const columnIds = new Set<string>();
    subtable.columns.forEach((column, index) => {
      if (columnIds.has(column.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["columns", index, "id"],
          message: "Column IDs must be unique",
        });
      }
      columnIds.add(column.id);
    });
  });

export const RandomTableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(ValidCollectionVisibilities),
  subtables: z.array(SubtableSchema).min(1, "At least one table is required"),
});

export type RandomTableFormData = z.infer<typeof RandomTableSchema>;

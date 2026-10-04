import { z } from "zod";
import { RandomTableSchema } from "@/lib/random-table-schema";
import { validateOfficialSource } from "@/lib/services/validate-source";

const OfficialRandomTablesSchema = z.object({
  source: z.unknown().optional(),
  data: z
    .array(
      z.object({
        type: z.literal("random-tables"),
        attributes: RandomTableSchema.omit({ visibility: true }),
      })
    )
    .min(1),
});

export function validateOfficialRandomTablesJSON(json: unknown) {
  const parsed = OfficialRandomTablesSchema.parse(json);
  return {
    source: validateOfficialSource(parsed.source),
    tables: parsed.data.map(({ attributes }) => ({
      ...attributes,
      visibility: "public" as const,
    })),
  };
}

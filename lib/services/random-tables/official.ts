import { z } from "zod";
import { RandomTableSchema, SubtableSchema } from "@/lib/random-table-schema";
import { validateOfficialSource } from "@/lib/services/validate-source";

// JSON resource/sub-table IDs are immutable import keys, not database IDs.
// Keep legacyName/legacyTitle at their original seed values even after renames:
// they bridge pre-key records on the first import while retaining persisted IDs.
const OfficialRandomTableSchema = RandomTableSchema.omit({
  visibility: true,
}).extend({
  legacyName: z.string().min(1).optional(),
  subtables: z
    .array(
      SubtableSchema.safeExtend({
        id: z.uuid(),
        legacyTitle: z.string().min(1).optional(),
      })
    )
    .min(1),
});

const OfficialRandomTablesSchema = z.object({
  source: z.unknown().optional(),
  data: z
    .array(
      z.object({
        id: z.uuid(),
        type: z.literal("random-tables"),
        attributes: OfficialRandomTableSchema,
      })
    )
    .min(1),
});

export type OfficialRandomTableInput = z.infer<
  typeof OfficialRandomTableSchema
> & {
  officialId: string;
  sourceId?: string;
};

export function validateOfficialRandomTablesJSON(json: unknown) {
  const parsed = OfficialRandomTablesSchema.parse(json);
  const ids = parsed.data.flatMap(({ id, attributes }) => [
    id,
    ...attributes.subtables.map((subtable) => subtable.id),
  ]);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Official table and sub-table IDs must be unique");
  }
  return {
    source: validateOfficialSource(parsed.source),
    tables: parsed.data.map(({ id, attributes }) => ({
      ...attributes,
      officialId: id,
      visibility: "public" as const,
    })),
  };
}

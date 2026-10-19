import { z } from "zod";

const OfficialConditionsSchema = z.object({
  data: z
    .array(
      z.object({
        type: z.literal("conditions"),
        attributes: z.object({
          name: z.string().trim().min(1),
          description: z.string().min(1),
        }),
      })
    )
    .min(1),
});

export interface ConditionSessionData {
  conditions: z.infer<typeof OfficialConditionsSchema>["data"];
}

export function validateOfficialConditionsJSON(
  json: unknown
): ConditionSessionData {
  const { data } = OfficialConditionsSchema.parse(json);
  const names = data.map(({ attributes }) => attributes.name.toLowerCase());
  if (new Set(names).size !== names.length)
    throw new Error("Official condition names must be unique");
  return { conditions: data };
}

import { z } from "zod";
import { ARMOR_TYPES, HIT_DIE_SIZES, STAT_TYPES } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";

const uuid = z.string().refine(isValidUUID, "Invalid UUID");
const name = z.string().trim().min(1, "Name is required");
const description = z.string().trim().min(1, "Description is required");

export const classInputSchema = z.object({
  name,
  description,
  keyStats: z
    .array(z.enum(STAT_TYPES))
    .length(2, "Must select exactly 2 stats"),
  hitDie: z.enum(HIT_DIE_SIZES),
  startingHp: z.number().min(1),
  saves: z
    .object({
      STR: z.number(),
      DEX: z.number(),
      INT: z.number(),
      WIL: z.number(),
    })
    .refine(
      (saves) => Object.values(saves).includes(1),
      "Must select an advantage save"
    )
    .refine(
      (saves) => Object.values(saves).includes(-1),
      "Must select a disadvantage save"
    ),
  armor: z.array(z.enum(ARMOR_TYPES)),
  weapons: z.array(
    z.union([
      z.object({ kind: z.enum(["blade", "stave", "wand"]) }),
      z.object({ type: z.enum(["STR", "DEX"]) }),
      z.object({ range: z.enum(["melee", "ranged"]) }),
    ])
  ),
  startingGear: z.array(z.string()),
  levels: z.array(
    z.object({
      level: z.number(),
      abilities: z.array(z.object({ id: uuid, name, description })),
    })
  ),
  abilityLists: z.array(
    z.object({
      name,
      description: z.string(),
      items: z
        .array(z.object({ name, description: z.string() }))
        .min(1, "At least one option is required"),
    })
  ),
  visibility: z.enum(["public", "private"]),
});

export const updateClassSchema = z.object({
  id: uuid,
  input: classInputSchema,
});

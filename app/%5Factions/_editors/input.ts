import { z } from "zod";
import { ValidCollectionVisibilities } from "@/lib/types";

const sharedEditorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required"),
  visibility: z.enum(ValidCollectionVisibilities),
  description: z.string().optional(),
});

const encounterMonsterSchema = z.object({
  monsterId: z.string().uuid(),
  quantity: z.number().int().min(1),
  isPerHero: z.boolean(),
  heroesPerMonster: z.number().int().min(1),
});

export const saveEncounterSchema = sharedEditorSchema.extend({
  heroCount: z.number().int().min(1, "Hero count must be at least 1"),
  heroLevel: z
    .number()
    .int()
    .min(1, "Hero level must be at least 1")
    .max(20, "Hero level must be at most 20"),
  monsters: z.array(encounterMonsterSchema),
});

const uuidArray = z.array(z.string().uuid());

export const saveCollectionSchema = sharedEditorSchema.extend({
  monsterIds: uuidArray,
  itemIds: uuidArray,
  companionIds: uuidArray,
  ancestryIds: uuidArray,
  backgroundIds: uuidArray,
  subclassIds: uuidArray,
  spellSchoolIds: uuidArray,
  classIds: uuidArray,
});

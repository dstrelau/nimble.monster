import { z } from "zod";
import { MonsterRoleOptions, SIZES } from "@/lib/services/monsters/types";

const actionSchema = z.object({
  id: z.string(),
  name: z.string(),
  damage: z.string().optional(),
  range: z.string().optional(),
  description: z.string().optional(),
});

const abilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  paperforgeId: z.string().optional(),
  hp: z.number(),
  hpPerHero: z.number().nullable().optional(),
  armor: z.enum(["none", "medium", "heavy"]),
  size: z.enum(SIZES.map(({ value }) => value)),
  saves: z.string().optional(),
  actionPreface: z.string().optional(),
  abilities: z.array(abilitySchema),
  actions: z.array(actionSchema),
});

const sharedSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  level: z.string(),
  levelInt: z.number().int(),
  actions: z.array(actionSchema),
  abilities: z.array(abilitySchema),
  actionPreface: z.string(),
  moreInfo: z.string().optional(),
  mild_encounter: z.string().optional(),
  spicy_encounter: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  sourceId: z.string().uuid().nullable().optional(),
});

const createHazardSchema = sharedSchema.extend({
  sourceId: z.string().uuid().optional(),
  remixedFromId: z.string().uuid().optional(),
});

const updateHazardSchema = sharedSchema.extend({
  id: z.string().uuid(),
  moreInfo: z.string(),
});

const monsterFields = {
  kind: z.string().optional(),
  hp: z.number(),
  hpPerHero: z.number().nullable().optional(),
  armor: z.enum(["", "none", "medium", "heavy"]),
  size: z.enum(SIZES.map(({ value }) => value)),
  speed: z.number(),
  fly: z.number().optional(),
  swim: z.number().optional(),
  climb: z.number().optional(),
  burrow: z.number().optional(),
  teleport: z.number().optional(),
  families: z.array(z.object({ id: z.string().uuid() })).optional(),
  members: z.array(memberSchema).optional(),
  legendary: z.boolean().optional(),
  minion: z.boolean().optional(),
  bloodied: z.string().optional(),
  lastStand: z.string().optional(),
  saves: z.array(z.string()).optional(),
  role: z.enum(MonsterRoleOptions).nullable().optional(),
  paperforgeId: z.string().nullable().optional(),
};

const createMonsterSchema = sharedSchema.extend({
  ...monsterFields,
  sourceId: z.string().uuid().optional(),
  fly: z.number(),
  swim: z.number(),
  climb: z.number(),
  burrow: z.number(),
  teleport: z.number(),
  remixedFromId: z.string().uuid().optional(),
});

const updateMonsterSchema = sharedSchema.extend({
  ...monsterFields,
  id: z.string().uuid(),
  armor: z.enum(["none", "medium", "heavy"]),
  kind: z.string(),
  legendary: z.boolean(),
  minion: z.boolean(),
  bloodied: z.string(),
  lastStand: z.string(),
  saves: z.array(z.string()),
  actionPreface: z.string(),
  moreInfo: z.string(),
});

export const createBestiaryEntrySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("monster"), input: createMonsterSchema }),
  z.object({ kind: z.literal("hazard"), input: createHazardSchema }),
]);

export const updateBestiaryEntrySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("monster"), input: updateMonsterSchema }),
  z.object({ kind: z.literal("hazard"), input: updateHazardSchema }),
]);

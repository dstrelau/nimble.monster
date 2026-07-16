import { z } from "zod";
import type { Monster } from "./types";

// Revives a stored monster version snapshot (opaque JSON persisted in the
// `monsters.versions` column) back into a typed `Monster` so it can be rendered
// by the same components as a live monster. Validating through Zod keeps the
// read boundary type-safe without any `as` casts. The `parseMonsterSnapshot`
// return annotation makes TypeScript verify the schema stays assignable to
// `Monster`; if the domain type gains a required field, this file fails to
// compile until the schema is updated.

const userSchema = z.object({
  id: z.string(),
  discordId: z.string(),
  username: z.string(),
  displayName: z.string(),
  imageUrl: z.string().optional(),
  bannerDismissed: z.boolean().optional(),
});

const abilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const actionSchema = z.object({
  id: z.string(),
  name: z.string(),
  damage: z.string().optional(),
  range: z.string().optional(),
  description: z.string().optional(),
});

const familyOverviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  abilities: z.array(abilitySchema),
  visibility: z.enum(["public", "secret", "private"]).optional(),
  monsterCount: z.number().optional(),
  creatorId: z.string(),
  creator: userSchema,
});

const sourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  license: z.string(),
  link: z.string(),
  abbreviation: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const awardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  description: z.string().nullish(),
  url: z.string(),
  color: z.string(),
  icon: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const roleSchema = z.enum([
  "melee",
  "ranged",
  "controller",
  "support",
  "aoe",
  "summoner",
  "striker",
  "ambusher",
  "defender",
  "skirmisher",
]);

const monsterSnapshotSchema = z.object({
  id: z.string(),
  hp: z.number(),
  hpPerHero: z.number().nullish(),
  kind: z.string().optional(),
  legendary: z.boolean(),
  minion: z.boolean(),
  level: z.string(),
  levelInt: z.number(),
  name: z.string(),
  size: z.enum(["tiny", "small", "medium", "large", "huge", "gargantuan"]),
  armor: z.enum(["none", "medium", "heavy"]),
  visibility: z.enum(["public", "private"]),
  paperforgeId: z.string().optional(),
  createdAt: z.coerce.date(),
  role: roleSchema.nullish(),
  isOfficial: z.boolean().optional(),
  saves: z.string().optional(),
  bloodied: z.string().optional(),
  lastStand: z.string().optional(),
  speed: z.number(),
  fly: z.number(),
  swim: z.number(),
  climb: z.number(),
  teleport: z.number(),
  burrow: z.number(),
  abilities: z.array(abilitySchema),
  actions: z.array(actionSchema),
  actionPreface: z.string(),
  moreInfo: z.string().optional(),
  mild_encounter: z.string().optional(),
  spicy_encounter: z.string().optional(),
  families: z.array(familyOverviewSchema),
  creator: userSchema,
  source: sourceSchema.optional(),
  awards: z.array(awardSchema).optional(),
  updatedAt: z.coerce.date(),
  imageUrl: z.string().optional(),
  remixedFromId: z.string().nullish(),
  remixedFrom: z
    .object({
      id: z.string(),
      name: z.string(),
      creator: userSchema,
    })
    .nullish(),
});

/**
 * Parse an opaque stored snapshot into a `Monster`. Returns null if the payload
 * does not match the expected shape (e.g. a snapshot written before a breaking
 * schema change), so callers can fall back gracefully rather than throwing.
 */
export function parseMonsterSnapshot(input: unknown): Monster | null {
  const result = monsterSnapshotSchema.safeParse(input);
  return result.success ? result.data : null;
}

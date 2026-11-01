import { z } from "zod";

export const SPELL_DAMAGE_TYPES = [
  "fire",
  "ice",
  "lightning",
  "necrotic",
  "radiant",
  "wind",
] as const;

export const WEAPON_DAMAGE_TYPES = [
  "bludgeoning",
  "piercing",
  "slashing",
] as const;

export const DAMAGE_TYPES = [
  ...SPELL_DAMAGE_TYPES,
  ...WEAPON_DAMAGE_TYPES,
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

const damageTypes = z
  .array(z.enum(DAMAGE_TYPES))
  .transform((values) => DAMAGE_TYPES.filter((type) => values.includes(type)));

export const monsterDamageInteractionFields = {
  vulnerabilities: damageTypes.optional(),
  resistances: damageTypes.optional(),
  immunities: damageTypes.optional(),
};

interface DamageInteractionLists {
  vulnerabilities?: DamageType[];
  resistances?: DamageType[];
  immunities?: DamageType[];
}

// A damage type can appear in at most one of vulnerabilities, resistances,
// and immunities.
export function refineDisjointDamageInteractions(
  value: DamageInteractionLists,
  ctx: z.RefinementCtx
) {
  const pairs = [
    ["vulnerabilities", "resistances"],
    ["vulnerabilities", "immunities"],
    ["resistances", "immunities"],
  ] as const;
  for (const [first, second] of pairs) {
    const overlap = (value[first] ?? []).filter((type) =>
      value[second]?.includes(type)
    );
    if (overlap.length) {
      ctx.addIssue({
        code: "custom",
        path: [second],
        message: `Damage types cannot be both ${first} and ${second}: ${overlap.join(", ")}`,
      });
    }
  }
}

// All lists are written together: when any is present, the others default
// to [] so the stored set is always validated as a whole. Omitting all
// preserves existing values on updates.
export const MonsterDamageInteractionsSchema = z
  .object(monsterDamageInteractionFields)
  .superRefine(refineDisjointDamageInteractions)
  .transform(({ vulnerabilities, resistances, immunities }) =>
    vulnerabilities || resistances || immunities
      ? {
          vulnerabilities: vulnerabilities ?? [],
          resistances: resistances ?? [],
          immunities: immunities ?? [],
        }
      : {}
  );

export type MonsterDamageInteractions = z.input<
  typeof MonsterDamageInteractionsSchema
>;

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
};

// A monster cannot be both vulnerable and resistant to the same damage type.
export function refineDisjointDamageInteractions(
  value: { vulnerabilities?: DamageType[]; resistances?: DamageType[] },
  ctx: z.RefinementCtx
) {
  const overlap = (value.vulnerabilities ?? []).filter((type) =>
    value.resistances?.includes(type)
  );
  if (overlap.length) {
    ctx.addIssue({
      code: "custom",
      path: ["resistances"],
      message: `Damage types cannot be both vulnerabilities and resistances: ${overlap.join(", ")}`,
    });
  }
}

// Both lists are written together: when either is present, the other defaults
// to [] so the stored pair is always validated as a whole. Omitting both
// preserves existing values on updates.
export const MonsterDamageInteractionsSchema = z
  .object(monsterDamageInteractionFields)
  .superRefine(refineDisjointDamageInteractions)
  .transform(({ vulnerabilities, resistances }) =>
    vulnerabilities || resistances
      ? {
          vulnerabilities: vulnerabilities ?? [],
          resistances: resistances ?? [],
        }
      : {}
  );

export type MonsterDamageInteractions = z.input<
  typeof MonsterDamageInteractionsSchema
>;

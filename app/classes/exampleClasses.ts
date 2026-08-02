import type {
  ArmorType,
  ClassAbility,
  HitDieSize,
  StatType,
  WeaponSpec,
} from "@/lib/types";
import { randomUUID } from "@/lib/utils";

const CLASS_LEVELS = 20;

export interface ExampleClass {
  name: string;
  description: string;
  keyStats: StatType[];
  hitDie: HitDieSize;
  startingHp: number;
  saves: Record<StatType, number>;
  armor: ArmorType[];
  weapons: WeaponSpec[];
  startingGear: string[];
  levels: { level: number; abilities: Omit<ClassAbility, "id">[] }[];
  abilityLists: {
    name: string;
    description: string;
    items: { name: string; description: string }[];
  }[];
}

/**
 * Expands an example into builder form values: every level 1-20 is present,
 * abilities get fresh ids, and empty levels keep one blank ability row.
 */
export function exampleClassToFormValues(example: ExampleClass) {
  return {
    name: example.name,
    description: example.description,
    keyStats: example.keyStats,
    hitDie: example.hitDie,
    startingHp: example.startingHp,
    saves: example.saves,
    armor: example.armor,
    weapons: example.weapons,
    startingGear: example.startingGear,
    levels: Array.from({ length: CLASS_LEVELS }, (_, i) => {
      const abilities = example.levels.find(
        (l) => l.level === i + 1
      )?.abilities;
      return {
        level: i + 1,
        abilities: abilities?.length
          ? abilities.map((a) => ({ ...a, id: randomUUID() }))
          : [{ id: randomUUID(), name: "", description: "" }],
      };
    }),
    abilityLists: example.abilityLists.map((l) => ({
      name: l.name,
      description: l.description,
      items: l.items.map((item) => ({
        name: item.name,
        description: item.description,
      })),
    })),
    visibility: "public" as const,
  };
}

export const EXAMPLE_CLASSES: Record<string, ExampleClass> = {
  Berserker: {
    name: "Berserker",
    description:
      "Wrath and Ruin. The Berserker is destruction. He knows not fatigue nor caution—both surely driven away from him in a relentless fury. Those of barbaric nature are said to eat only the dust of war and drink naught but the blood of those felled by their own hand.\n\nDeath is no stranger, for it is said that even death fears to take a Berserker before his battle Rage is satiated. Once a Berserker has begun to fight, he only grows stronger, fueled by battle-lust and an unending Rage. The deadliest among them is not the well-rested, but those who are pushed to the brink through combat.",
    keyStats: ["STR", "DEX"],
    hitDie: "d12",
    startingHp: 20,
    saves: {
      STR: 1,
      DEX: 0,
      INT: -1,
      WIL: 0,
    },
    armor: [],
    weapons: [
      {
        type: "STR",
      },
    ],
    startingGear: ["Battleaxe", "Rations (meat)", "Rope (50 ft.)"],
    levels: [
      {
        level: 1,
        abilities: [
          {
            name: "Rage",
            description:
              "(1/turn) Action: Roll a Fury Die (1d4) and set it aside. Add it to every STR attack you make. You can have a max of KEY Fury Dice; they are lost when your Rage ends.",
          },
          {
            name: "That all you got?!",
            description:
              "When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR+DEX for each die spent.",
          },
        ],
      },
      {
        level: 2,
        abilities: [
          {
            name: "Intensifying Fury",
            description:
              "If you are Raging at the beginning of your turn, roll 1 Fury Die for free.",
          },
          {
            name: "One with the Ancients",
            description:
              "(1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path.",
          },
        ],
      },
      {
        level: 3,
        abilities: [
          {
            name: "Subclass",
            description: "Choose a Berserker subclass.",
          },
          {
            name: "Bloodlust",
            description:
              "Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free.",
          },
        ],
      },
      {
        level: 4,
        abilities: [
          {
            name: "Enduring Rage",
            description:
              "While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks.",
          },
          {
            name: "Key Stat Increase",
            description: "+1 STR or DEX.",
          },
          {
            name: "Savage Arsenal",
            description: "Choose 1 ability from the Savage Arsenal.",
          },
        ],
      },
      {
        level: 5,
        abilities: [
          {
            name: "Rage (2)",
            description: "Whenever you Rage, gain 2 Fury Dice instead.",
          },
          {
            name: "Secondary Stat Increase",
            description: "+1 INT or WIL.",
          },
        ],
      },
      {
        level: 6,
        abilities: [
          {
            name: "Savage Arsenal (2)",
            description: "Choose a 2nd Savage Arsenal ability.",
          },
          {
            name: "Intensifying Fury (2)",
            description: "Your Fury Dice are now d6s.",
          },
        ],
      },
      {
        level: 7,
        abilities: [
          {
            name: "Subclass",
            description: "Gain your Berserker subclass feature.",
          },
        ],
      },
      {
        level: 8,
        abilities: [
          {
            name: "Savage Arsenal (3)",
            description: "Choose a 3rd Savage Arsenal ability.",
          },
          {
            name: "Key Stat Increase",
            description: "+1 STR or DEX.",
          },
        ],
      },
      {
        level: 9,
        abilities: [
          {
            name: "Intensifying Fury (3)",
            description: "Your Fury Dice are now d8s.",
          },
          {
            name: "Secondary Stat Increase",
            description: "+1 INT or WIL.",
          },
        ],
      },
      {
        level: 10,
        abilities: [
          {
            name: "Savage Arsenal (4)",
            description: "Choose a 4th Savage Arsenal ability.",
          },
        ],
      },
      {
        level: 11,
        abilities: [
          {
            name: "Subclass",
            description: "Gain your Berserker subclass feature.",
          },
        ],
      },
      {
        level: 12,
        abilities: [
          {
            name: "Savage Arsenal (5)",
            description: "Choose a 5th Savage Arsenal ability.",
          },
          {
            name: "Key Stat Increase",
            description: "+1 STR or DEX.",
          },
        ],
      },
      {
        level: 13,
        abilities: [
          {
            name: "Intensifying Fury (4)",
            description: "Your Fury Dice are now d10s.",
          },
          {
            name: "Secondary Stat Increase",
            description: "+1 INT or WIL.",
          },
        ],
      },
      {
        level: 14,
        abilities: [
          {
            name: "Savage Arsenal (6)",
            description: "Choose a 6th Savage Arsenal ability.",
          },
        ],
      },
      {
        level: 15,
        abilities: [
          {
            name: "Subclass",
            description: "Gain your Berserker subclass feature.",
          },
        ],
      },
      {
        level: 16,
        abilities: [
          {
            name: "Savage Arsenal (7)",
            description: "Choose a 7th Savage Arsenal ability.",
          },
          {
            name: "Key Stat Increase",
            description: "+1 STR or DEX.",
          },
        ],
      },
      {
        level: 17,
        abilities: [
          {
            name: "Intensifying Fury (5)",
            description: "Your Fury Dice are now d12s.",
          },
          {
            name: "Secondary Stat Increase",
            description: "+1 INT or WIL.",
          },
        ],
      },
      {
        level: 18,
        abilities: [
          {
            name: "DEEP RAGE",
            description: "Dropping to 0 HP does not cause your Rage to end.",
          },
        ],
      },
      {
        level: 19,
        abilities: [
          {
            name: "Epic Boon",
            description: "Choose an Epic Boon.",
          },
        ],
      },
      {
        level: 20,
        abilities: [
          {
            name: "BOUNDLESS RAGE",
            description:
              "+1 to any 2 of your stats. Anytime you roll less than 6 on a Fury Die, change it to 6 instead.",
          },
        ],
      },
    ],
    abilityLists: [
      {
        name: "Savage Arsenal",
        description: "Choose Savage Arsenal abilities as you level up.",
        items: [
          {
            name: "Death Blow",
            description:
              "After you deal damage from a crit, you may expend any number of Fury Dice. Sum the dice and deal double that amount of damage.",
          },
          {
            name: "Deathless Rage",
            description:
              "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action.",
          },
          {
            name: "Eager for Battle",
            description:
              "Gain advantage on Initiative. Move 2×DEX spaces for free on your first turn each encounter.",
          },
          {
            name: "Into the Fray",
            description:
              "Action: Leap up to 2×DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, make an attack against 1 of them for free.",
          },
          {
            name: "Mighty Endurance",
            description:
              "You can now survive an additional 4 Wounds before death.",
          },
          {
            name: "MORE BLOOD!",
            description: "Whenever an enemy crits you, gain 1 Fury Die.",
          },
          {
            name: "Rampage",
            description:
              "(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again.",
          },
          {
            name: "Swift Fury",
            description:
              "Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain.",
          },
          {
            name: "Thunderous Steps",
            description:
              "After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop.",
          },
          {
            name: "Unstoppable Force",
            description:
              "While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3).",
          },
          {
            name: "Whirlwind",
            description:
              "2 actions: Attack ALL targets within your melee weapon's reach.",
          },
          {
            name: "You're Next!",
            description:
              "Action: While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle.",
          },
        ],
      },
    ],
  },
};

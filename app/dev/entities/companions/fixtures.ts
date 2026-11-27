import type { Companion, User } from "@/lib/types";

const FIXTURE_DATE = new Date("2026-01-15T12:00:00.000Z");

const COMPANION_LAB_CREATOR: User = {
  id: "companion-lab-creator",
  discordId: "",
  username: "fixture-maker",
  displayName: "Fixture Maker",
};

interface CompanionCardCase {
  id: string;
  label: string;
  companion: Companion;
}

const COMPANION_BASE: Companion = {
  id: "",
  name: "Stabs, the Somewhat Reliable",
  kind: "Kobold",
  class: "The Cheat",
  hp_per_level: "5",
  size: "small",
  saves: "DEX+",
  wounds: 3,
  visibility: "public",
  paperforgeId: "17e",
  abilities: [
    {
      id: "companion-ability",
      name: "Companion",
      description:
        "Can Interpose for friends (but you'll never hear the end of it!)",
    },
    {
      id: "companion-pocket-sand",
      name: "Pocket Sand!",
      description:
        "(1/encounter) force an adjacent enemy to reroll an attack with disadvantage.",
    },
  ],
  actions: [
    {
      id: "companion-stab",
      name: "Stab!",
      damage: "1d4",
      description:
        "(Advantage VS Distracted targets). On Crit: +LVL damage (instead of rolling additional dice)",
    },
    {
      id: "companion-shadowstep",
      name: "Shadowstep",
      damage: "",
      description:
        "Teleport behind a creature you can see (DC 10 WIL save or [[Frightened]] 1 Turn).",
    },
  ],
  actionPreface: "Each turn, move 4 then choose 1:",
  dyingRule:
    "When Stabs drops to 0 HP, he can turn Invisible until the end of his next turn.",
  moreInfo:
    "Found sleeping in a treasure chest, and quite offended to be woken.",
  creator: COMPANION_LAB_CREATOR,
  updatedAt: FIXTURE_DATE,
};

const COMPANION_FIXTURES: CompanionCardCase[] = [
  {
    id: "typical",
    label: "Companion: artwork + saves",
    companion: COMPANION_BASE,
  },
  {
    id: "no-art",
    label: "Companion: no artwork",
    companion: { ...COMPANION_BASE, paperforgeId: undefined },
  },
  {
    id: "no-saves",
    label: "Companion: no saves, medium size",
    companion: {
      ...COMPANION_BASE,
      name: "Bramble",
      kind: "Wolf",
      class: "The Loyal Hound",
      size: "medium",
      saves: "",
      hp_per_level: "8",
      paperforgeId: "526",
      wounds: 4,
    },
  },
  {
    id: "many-saves",
    label: "Companion: many saves wrap beside artwork",
    companion: {
      ...COMPANION_BASE,
      name: "Oracle Wisp",
      kind: "Spirit",
      class: "The Seer",
      size: "tiny",
      saves: "STR+, DEX++, INT-, WIL+",
      hp_per_level: "12",
      paperforgeId: "325",
    },
  },
  {
    id: "long-name",
    label: "Companion: long name + long descriptor",
    companion: {
      ...COMPANION_BASE,
      name: "Sir Reginald Fluffington-Smythe the Third, Defender of the Hearth",
      kind: "Ancient Clockwork Guardian Cat of the Sunken Foundry",
      class: "The Very Dignified Protector of Small Things",
      size: "large",
      saves: "STR+, WIL++",
      hp_per_level: "10",
      paperforgeId: "364",
    },
  },
  {
    id: "unbroken-name",
    label: "Companion: unbroken name, no artwork",
    companion: {
      ...COMPANION_BASE,
      name: "Ghraxxathulmorgovianthraxielic",
      paperforgeId: undefined,
    },
  },
  {
    id: "minimal",
    label: "Companion: minimal (no abilities, no dying rule, no description)",
    companion: {
      ...COMPANION_BASE,
      name: "Pebble",
      kind: "Rock",
      class: "The Silent",
      saves: "",
      paperforgeId: undefined,
      abilities: [],
      actionPreface: "",
      actions: [
        {
          id: "companion-roll",
          name: "Roll",
          damage: "1d6",
          description: "",
        },
      ],
      dyingRule: "",
      moreInfo: undefined,
    },
  },
];

// Cards and links require UUIDs, so give each case its own.
export const COMPANION_CARD_CASES: CompanionCardCase[] = COMPANION_FIXTURES.map(
  (sample, index) => ({
    ...sample,
    companion: {
      ...sample.companion,
      id: `00000000-0000-4000-9000-${(index + 1).toString().padStart(12, "0")}`,
    },
  })
);

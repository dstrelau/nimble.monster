import type { Hazard, Monster } from "@/lib/services/monsters";
import type { MonsterDamageInteractions } from "@/lib/services/monsters/damage-types";

// Snapshot of the public Troll Hunter card, including its original punctuation:
// https://nimble.nexus/monsters/troll-hunter-24k8fzpnyn9cztqw0x7gsrakfq
export const TROLL_HUNTER: Monster = {
  id: "449a1ffb-57d5-4b3f-abf0-1d3c33854df7",
  name: "Troll Hunter",
  hp: 90,
  legendary: false,
  minion: false,
  hazard: false,
  level: "10",
  levelInt: 10,
  visibility: "public",
  size: "large",
  armor: "medium",
  paperforgeId: "526",
  createdAt: new Date("2025-03-30T13:51:16.183Z"),
  updatedAt: new Date("2026-02-03T22:49:13.848Z"),
  kind: "humanoid (giant) - artillery/brute",
  speed: 6,
  fly: 0,
  swim: 0,
  climb: 0,
  teleport: 0,
  burrow: 0,
  abilities: [
    {
      id: "c79b04c6-6c35-4d4c-9471-e4f7a8ff3318",
      name: "Damage Interactions",
      description: "Fire (V), Acid (V)",
    },
    {
      id: "90113a74-427a-443c-ab3a-c039e7b44cd7",
      name: "Troll Blood",
      description:
        "Regains 10HP every turn. Does not die at 0HP. This ability is supressed for 1 turn after taking fire or acid damage.",
    },
    {
      id: "d88f4837-1b03-4779-a51f-d03862c5371b",
      name: "Blend in",
      description:
        "Weaknesses of Trolls are known far and wide. Troll Hunters disguise themself in a big cloak to hide their troll nature until they are engaged in melee.",
    },
  ],
  actions: [
    {
      id: "5f33ac8c-e913-4546-b425-5cbb936c6b39",
      name: "Heavy Crossbow",
      damage: "(Range 2-12) 2d10+10 piercing.",
      description: "On damage: Prone.",
    },
    {
      id: "5d265435-c06d-4058-add7-33b7b09ea3cc",
      name: "Claw (2x)",
      damage: "2d6+8 slashing.",
      description: "",
    },
    {
      id: "0858c369-2ad0-402e-8b24-eff1e4e2e76b",
      name: "Bite",
      damage: "4d8+12 piercing.",
      description: "",
    },
  ],
  actionPreface: "Choose one.",
  moreInfo: "Made by SanityWithIn for Monstery Monday Week 9: Forest.",
  families: [],
  creator: {
    id: "ce3f2e61-62ce-4589-ba8b-da3c93630c0d",
    discordId: "317711883568414722",
    username: "sanitywithin",
    displayName: "SanityWithIn",
  },
};

interface MonsterCardCase {
  id: string;
  label: string;
  monster: Monster;
  /** Legendary conversions only; minions have no legendary variant. */
  soloHp?: number;
  saves?: string;
  damageInteractions?: MonsterDamageInteractions;
}

const STRESS_BASE: Monster = {
  ...TROLL_HUNTER,
  abilities: TROLL_HUNTER.abilities.slice(0, 1),
  actions: TROLL_HUNTER.actions.slice(0, 1),
  moreInfo: undefined,
};

const LEVIATHAN: Monster = {
  ...STRESS_BASE,
  name: "Ancient Clockwork Leviathan of the Sunken Foundry",
  level: "20",
  levelInt: 20,
  size: "gargantuan",
  kind: "Construct",
  role: "aoe",
  armor: "heavy",
  hp: 999,
  paperforgeId: "364",
  speed: 12,
  swim: 12,
  fly: 10,
  climb: 6,
  burrow: 4,
  teleport: 30,
  creatureTypes: ["construct", "elemental"],
  creatureKinds: ["automaton"],
  environments: ["underground", "ruins", "aquatic", "volcanic"],
};

// Mirrors the seeded Bandit Minion: no level, no armor, 1 HP.
const BANDIT_MINION: Monster = {
  ...STRESS_BASE,
  name: "Bandit Minion",
  minion: true,
  level: "",
  levelInt: 0,
  size: "small",
  kind: "",
  hp: 1,
  armor: "none",
  paperforgeId: "17e",
  moreInfo: undefined,
  creatureTypes: ["humanoid"],
  creatureKinds: ["bandit"],
  abilities: [
    {
      id: "minion-inept",
      name: "Inept",
      description: "Your attacks miss on 8.",
    },
    {
      id: "minion-mortal-panic",
      name: "Mortal Panic",
      description: "Attacks miss you on a 2 or less.",
    },
  ],
  actionPreface: "",
  actions: [
    {
      id: "minion-cut-ya",
      name: "I’ll Cut Ya!",
      damage: "1d8",
      description: "(follows @rule:[minions|minion rules])",
    },
  ],
};

const RAMBLING =
  "every other turn the bandit also shouts a very long and rambling battle cry that keeps going well past the end of the first line, so it has to wrap around the artwork.";

export const MONSTER_CARD_CASES: MonsterCardCase[] = [
  {
    id: "troll",
    label: "Typical name + artwork",
    monster: {
      ...TROLL_HUNTER,
      creatureTypes: ["giant", "humanoid"],
      creatureKinds: ["troll"],
      environments: ["forest", "swamp"],
    },
    soloHp: 45,
    saves: "STR++, WIL+",
    damageInteractions: {
      resistances: ["ice"],
      vulnerabilities: ["fire", "radiant"],
    },
  },
  {
    id: "captain",
    label: "Long name + artwork",
    monster: {
      ...STRESS_BASE,
      name: "Captain Sylvestra Redmane, the Red Siren",
      level: "12",
      levelInt: 12,
      size: "medium",
      kind: "Varis' Ex-Paramour",
      role: "melee",
      hp: 120,
      swim: 8,
      climb: 3,
      paperforgeId: "325",
      creatureTypes: ["humanoid"],
      creatureKinds: ["human"],
      environments: ["aquatic", "settlement"],
    },
    soloHp: 90,
    saves: "STR+, DEX++, INT-, WIL+",
    damageInteractions: {
      resistances: [],
      vulnerabilities: ["fire", "radiant"],
    },
  },
  {
    id: "leviathan",
    label: "Long name + every movement mode + artwork",
    monster: LEVIATHAN,
    soloHp: 120,
    saves: "STR+, DEX++, INT-, WIL+",
    damageInteractions: {
      resistances: ["fire", "necrotic", "bludgeoning"],
      vulnerabilities: ["ice", "radiant"],
    },
  },
  {
    id: "leviathan-no-art",
    label: "Same dense monster, without artwork",
    monster: { ...LEVIATHAN, paperforgeId: undefined },
    soloHp: 120,
    saves: "STR+, DEX++, INT-, WIL+",
    damageInteractions: {
      resistances: ["fire", "necrotic", "bludgeoning"],
      vulnerabilities: ["ice", "radiant"],
    },
  },
  {
    id: "unbroken",
    label: "Unbroken name + no artwork + no armor",
    monster: {
      ...STRESS_BASE,
      name: "Ghraxxathulmorgovianthraxiel",
      level: "5",
      levelInt: 5,
      size: "medium",
      kind: "Humanoid",
      armor: "none",
      hp: 65,
      fly: 8,
      paperforgeId: undefined,
    },
    soloHp: 65,
    saves: "STR++, DEX++, INT-, WIL+",
  },
  {
    id: "imp",
    label: "Tiny name + dense stats + artwork",
    monster: {
      ...STRESS_BASE,
      name: "Imp",
      level: "1/2",
      levelInt: -2,
      size: "tiny",
      kind: "Fiend",
      hp: 12,
      speed: 4,
      fly: 8,
      teleport: 6,
      creatureTypes: ["fiend"],
      creatureKinds: ["devil"],
      environments: ["volcanic", "dungeon"],
    },
    soloHp: 12,
    saves: "DEX++, WIL-",
    damageInteractions: { resistances: ["fire"], vulnerabilities: ["ice"] },
  },
  {
    id: "swarm",
    label: "Long metadata + per-hero HP + no artwork",
    monster: {
      ...STRESS_BASE,
      name: "Swarm of Gnashing Teeth",
      level: "7",
      levelInt: 7,
      size: "huge",
      kind: "Aberration (Ooze, Swarm of Tiny Eldritch Things)",
      role: "skirmisher",
      hp: 0,
      hpPerHero: 35,
      swim: 6,
      climb: 6,
      paperforgeId: undefined,
      creatureTypes: ["aberration", "ooze"],
      environments: ["ruins", "dungeon", "underground"],
    },
    soloHp: 135,
    saves: "STR-, DEX++, INT+, WIL++",
    damageInteractions: {
      resistances: ["bludgeoning", "necrotic"],
      vulnerabilities: ["fire"],
    },
  },
  {
    id: "vorthelax",
    label: "Long solo title + saves + artwork",
    monster: {
      ...STRESS_BASE,
      name: "Vorthelax the Unending, Devourer of the Ninth Sky",
      level: "15",
      levelInt: 15,
      size: "gargantuan",
      kind: "Dragon",
      armor: "heavy",
      hp: 360,
      fly: 10,
      paperforgeId: "364",
      creatureTypes: ["dragon"],
      creatureKinds: ["drake"],
      environments: ["mountains", "arctic"],
    },
    soloHp: 120,
    saves: "STR+, DEX++, INT-, WIL+",
    damageInteractions: {
      resistances: ["fire", "lightning"],
      vulnerabilities: ["ice"],
    },
  },
  {
    id: "minion",
    label: "Minion + artwork + short abilities",
    monster: BANDIT_MINION,
  },
  {
    id: "minion-long-name",
    label: "Minion + long name wraps beside artwork",
    monster: {
      ...BANDIT_MINION,
      name: "Bandit Minion Warlord of the Sunken Foundry",
    },
  },
  {
    id: "minion-long-ability",
    label: "Minion + long first ability wraps around artwork",
    monster: {
      ...BANDIT_MINION,
      abilities: [
        {
          id: "minion-inept",
          name: "Inept",
          description: `Your attacks miss on 8, and ${RAMBLING}`,
        },
        ...BANDIT_MINION.abilities.slice(1),
      ],
    },
  },
  {
    id: "minion-no-abilities",
    label: "Minion + artwork, no abilities, long action",
    monster: {
      ...BANDIT_MINION,
      abilities: [],
      actions: [
        {
          id: "minion-cut-ya",
          name: "I’ll Cut Ya!",
          damage: "1d8",
          description: `(follows @rule:[minions|minion rules]) ${RAMBLING}`,
        },
      ],
    },
  },
  {
    id: "minion-stats",
    label: "Minion + movement stats + artwork",
    monster: { ...BANDIT_MINION, fly: 8, speed: 4 },
  },
];

interface HazardCardCase {
  id: string;
  label: string;
  hazard: Hazard;
  showEncounterGuidelines?: boolean;
}

const HAZARD_BASE: Hazard = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Spiked Pit",
  hazard: true,
  level: "3",
  levelInt: 3,
  hp: 20,
  visibility: "public",
  createdAt: TROLL_HUNTER.createdAt,
  updatedAt: TROLL_HUNTER.updatedAt,
  creator: TROLL_HUNTER.creator,
  abilities: [
    {
      id: "hazard-concealed",
      name: "Concealed",
      description: "DC 14 Perception to notice before anyone steps on it.",
    },
  ],
  actions: [
    {
      id: "hazard-impale",
      name: "Impale",
      damage: "2d8 piercing.",
      description: "On damage: Prone. DC 12 STR save to climb out.",
    },
  ],
  actionPreface: "When a creature falls in:",
  moreInfo: "Built into the floor of a forgotten barrow.",
};

const HAZARD_FIXTURES: HazardCardCase[] = [
  { id: "hazard-typical", label: "Hazard: typical", hazard: HAZARD_BASE },
  {
    id: "hazard-no-hp",
    label: "Hazard: no HP, so no stat band",
    hazard: {
      ...HAZARD_BASE,
      name: "Rolling Boulder",
      level: "5",
      levelInt: 5,
      hp: 0,
      abilities: [],
      actionPreface: "",
      actions: [
        {
          id: "hazard-crush",
          name: "Crush",
          damage: "4d6 bludgeoning.",
          description: "Each creature in the corridor makes a DEX save.",
        },
      ],
    },
  },
  {
    id: "hazard-no-level",
    label: "Hazard: no level",
    hazard: {
      ...HAZARD_BASE,
      name: "Tripwire",
      level: "",
      levelInt: 0,
      hp: 1,
      abilities: [],
      actionPreface: "",
      actions: [
        {
          id: "hazard-trip",
          name: "Snap",
          damage: "",
          description: "The first creature to cross is Prone.",
        },
      ],
      moreInfo: undefined,
    },
  },
  {
    id: "hazard-fractional-level",
    label: "Hazard: fractional level",
    hazard: {
      ...HAZARD_BASE,
      name: "Slippery Moss",
      level: "1/2",
      levelInt: -2,
      hp: 5,
    },
  },
  {
    id: "hazard-long-name",
    label: "Hazard: long name + three-digit HP",
    hazard: {
      ...HAZARD_BASE,
      name: "The Grand Collapsing Colonnade of Ashen Kings",
      level: "18",
      levelInt: 18,
      hp: 240,
    },
  },
  {
    id: "hazard-unbroken-name",
    label: "Hazard: unbroken name",
    hazard: {
      ...HAZARD_BASE,
      name: "Ghraxxathulmorgovianthraxielic Trap",
      level: "9",
      levelInt: 9,
      hp: 45,
    },
  },
  {
    id: "hazard-dense",
    label: "Hazard: many abilities and actions + encounter guidelines",
    hazard: {
      ...HAZARD_BASE,
      name: "Flooding Crypt",
      level: "7",
      levelInt: 7,
      hp: 60,
      abilities: [
        {
          id: "hazard-rising",
          name: "Rising Water",
          description:
            "At the start of each round, the water rises one step. Creatures in deep water are [[Restrained|restrained]] by the current.",
        },
        {
          id: "hazard-drain",
          name: "Drain",
          description:
            "A DC 15 Mighty check opens a sluice gate, ending Rising Water for 1d4 rounds.",
        },
      ],
      actionPreface: "Choose one.",
      actions: [
        {
          id: "hazard-surge",
          name: "Surge",
          damage: "3d6 bludgeoning.",
          description:
            "(Range 6) Each creature in the room makes a STR save or is pushed 4 spaces.",
        },
        {
          id: "hazard-eels",
          name: "Electric Eels",
          damage: "2d10 lightning.",
          description:
            "The target and each creature adjacent to it takes damage. On damage: [[Dazed]].",
        },
      ],
      mild_encounter: "Pair with a few skeletal minions that ignore the water.",
      spicy_encounter: "Add a drowned banshee that sings from the far wall.",
    },
    showEncounterGuidelines: true,
  },
];

// Cards and links require UUIDs, so give each case its own.
export const HAZARD_CARD_CASES: HazardCardCase[] = HAZARD_FIXTURES.map(
  (sample, index) => ({
    ...sample,
    hazard: {
      ...sample.hazard,
      id: `00000000-0000-4000-8000-${(index + 1).toString().padStart(12, "0")}`,
    },
  })
);

import type { Monster } from "@/lib/services/monsters";

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
  moreInfo: "Made by SanityWithIn for Monster Monday Week 9: Forest.",
  families: [],
  creator: {
    id: "ce3f2e61-62ce-4589-ba8b-da3c93630c0d",
    discordId: "317711883568414722",
    username: "sanitywithin",
    displayName: "SanityWithIn",
  },
};

export interface MockDamageInteractions {
  resistant: ("fire" | "ice" | "acid" | "poison" | "lightning" | "physical")[];
  vulnerable: ("fire" | "ice" | "acid" | "poison" | "lightning" | "physical")[];
}

interface MonsterCardCase {
  id: string;
  label: string;
  monster: Monster;
  soloHp: number;
  saves: string;
  damageInteractions?: MockDamageInteractions;
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
    damageInteractions: { resistant: ["ice"], vulnerable: ["fire", "acid"] },
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
    damageInteractions: { resistant: [], vulnerable: ["fire", "acid"] },
  },
  {
    id: "leviathan",
    label: "Long name + every movement mode + artwork",
    monster: LEVIATHAN,
    soloHp: 120,
    saves: "STR+, DEX++, INT-, WIL+",
    damageInteractions: {
      resistant: ["fire", "poison", "physical"],
      vulnerable: ["ice", "acid"],
    },
  },
  {
    id: "leviathan-no-art",
    label: "Same dense monster, without artwork",
    monster: { ...LEVIATHAN, paperforgeId: undefined },
    soloHp: 120,
    saves: "STR+, DEX++, INT-, WIL+",
    damageInteractions: {
      resistant: ["fire", "poison", "physical"],
      vulnerable: ["ice", "acid"],
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
    damageInteractions: { resistant: ["fire"], vulnerable: ["ice"] },
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
      resistant: ["physical", "poison"],
      vulnerable: ["fire"],
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
      resistant: ["fire", "lightning"],
      vulnerable: ["ice"],
    },
  },
];

import { z } from "zod";

export const CREATURE_TYPES = [
  "aberration",
  "beast",
  "celestial",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "fiend",
  "giant",
  "humanoid",
  "monstrosity",
  "ooze",
  "plant",
  "undead",
] as const;

export const CREATURE_KINDS = [
  "human",
  "elf",
  "dwarf",
  "halfling",
  "gnome",
  "orc",
  "bandit",
  "cultist",
  "druid",
  "goblinoid",
  "goblin",
  "bugbear",
  "kobold",
  "gnoll",
  "lizardfolk",
  "snakeman",
  "ratfolk",
  "catfolk",
  "frogfolk",
  "birdfolk",
  "centaur",
  "gith",
  "mind-flayer",
  "bird",
  "canine",
  "feline",
  "rodent",
  "reptile",
  "snake",
  "spider",
  "insect",
  "crustacean",
  "cephalopod",
  "fish",
  "dinosaur",
  "dragon",
  "drake",
  "wyvern",
  "hydra",
  "angel",
  "demon",
  "balor",
  "glabrezu",
  "spiny-fiend",
  "stenchling",
  "devil",
  "hag",
  "genie",
  "mephit",
  "dryad",
  "lycanthrope",
  "oni",
  "golem",
  "automaton",
  "animated-object",
  "skeleton",
  "zombie",
  "ghoul",
  "ghost",
  "specter",
  "wraith",
  "vampire",
  "mummy",
  "lich",
  "briarbane",
  "fungus",
  "treant",
  "mimic",
  "stirge",
  "ooze",
  "troll",
  "ogre",
  "giant",
  "basilisk",
  "bulette",
  "cloaker",
  "duskprowler",
  "ettercap",
  "griffon",
  "manticore",
  "nestweaver",
  "owlbear",
  "roc",
  "umber-hulk",
  "worg",
  "worm",
] as const;

export const MONSTER_ENVIRONMENTS = [
  "forest",
  "jungle",
  "grassland",
  "hills",
  "mountains",
  "desert",
  "arctic",
  "swamp",
  "aquatic",
  "underground",
  "dungeon",
  "settlement",
  "ruins",
  "graveyard",
  "volcanic",
] as const;

export type CreatureType = (typeof CREATURE_TYPES)[number];
export type CreatureKind = (typeof CREATURE_KINDS)[number];
export type MonsterEnvironment = (typeof MONSTER_ENVIRONMENTS)[number];

// Omitted fields preserve existing assignments on updates; [] explicitly clears.
export const MonsterClassificationsSchema = z.object({
  creatureTypes: z
    .array(z.enum(CREATURE_TYPES))
    .transform((values) => [...new Set(values)])
    .optional(),
  creatureKinds: z
    .array(z.enum(CREATURE_KINDS))
    .transform((values) => [...new Set(values)])
    .optional(),
  environments: z
    .array(z.enum(MONSTER_ENVIRONMENTS))
    .transform((values) => [...new Set(values)])
    .optional(),
});

export type MonsterClassifications = z.infer<
  typeof MonsterClassificationsSchema
>;

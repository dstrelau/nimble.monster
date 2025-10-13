import type { Item, ItemMini } from "@/lib/services/items";
import type {
  Monster,
  MonsterMini,
  MonsterSize,
} from "@/lib/services/monsters";

export const CollectionVisibility = {
  PUBLIC: "public",
  PRIVATE: "private",
  SECRET: "secret",
} as const;

export const ValidCollectionVisibilities = [
  CollectionVisibility.PUBLIC,
  CollectionVisibility.PRIVATE,
] as const;
export type CollectionVisibilityType =
  (typeof ValidCollectionVisibilities)[number];

export const TAILWIND_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
] as const;

export const COLOR_VARIANTS = [200, 400, 600] as const;

export type TailwindColor = (typeof TAILWIND_COLORS)[number];
export type ColorVariant = (typeof COLOR_VARIANTS)[number];

export const FAMILY_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "secret", label: "Secret" },
  { value: "private", label: "Private" },
] as const;
export type FamilyVisibility = (typeof FAMILY_VISIBILITY)[number]["value"];

export interface FamilyOverview {
  id: string;
  name: string;
  description?: string;
  abilities: Ability[];
  visibility?: FamilyVisibility;
  monsterCount?: number;
  creatorId: string;
  creator: User;
}

export interface Family extends FamilyOverview {
  monsters: Monster[];
}

export const COMPANION_STATS = [
  { value: "STR+", label: "STR+" },
  { value: "DEX+", label: "DEX+" },
  { value: "CON+", label: "CON+" },
  { value: "INT+", label: "INT+" },
  { value: "WIS+", label: "WIS+" },
  { value: "WIL+", label: "WIL+" },
  { value: "CHA+", label: "CHA+" },
] as const;
export type CompanionStat = (typeof COMPANION_STATS)[number]["value"];

export interface CompanionMini {
  id: string;
  name: string;
  hp_per_level: string;
  wounds: number;
  visibility: "public" | "private";
}

export interface Companion extends CompanionMini {
  kind: string;
  class: string;
  size: MonsterSize;
  saves: string;
  abilities: Ability[];
  actions: Action[];
  actionPreface: string;
  dyingRule: string;
  moreInfo?: string;
  creator: User;
  updatedAt: Date;
  imageUrl?: string;
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  official: boolean;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
}

export interface Action {
  id: string;
  name: string;
  damage?: string;
  range?: string;
  description?: string;
}

export interface Collection extends CollectionOverview {
  monsters: Monster[];
  items: Item[];
}

export interface CollectionOverview {
  id: string;
  creator: User;
  description?: string;
  legendaryCount: number;
  monsters: MonsterMini[];
  name: string;
  standardCount: number;
  items: ItemMini[];
  itemCount: number;
  visibility: CollectionVisibilityType;
  createdAt?: Date;
}

export const UNKNOWN_USER: User = {
  id: "",
  discordId: "",
  username: "",
  displayName: "",
  imageUrl: "",
};

export interface User {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  imageUrl?: string;
}

export const SUBCLASS_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;
export type SubclassVisibility = (typeof SUBCLASS_VISIBILITY)[number]["value"];

export const SUBCLASS_CLASSES = [
  { value: "Artificer", label: "Artificer" },
  { value: "Berserker", label: "Berserker" },
  { value: "The Cheat", label: "Cheat, The" },
  { value: "Commander", label: "Commander" },
  { value: "Hexbinder", label: "Hexbinder" },
  { value: "Hunter", label: "Hunter" },
  { value: "Mage", label: "Mage" },
  { value: "Oathsworn", label: "Oathsworn" },
  { value: "Shadowmancer", label: "Shadowmancer" },
  { value: "Shepherd", label: "Shepherd" },
  { value: "Songweaver", label: "Songweaver" },
  { value: "Stormshifter", label: "Stormshifter" },
  { value: "Zephyr", label: "Zephyr" },
] as const;
export type SubclassClass = (typeof SUBCLASS_CLASSES)[number]["value"];

export const SUBCLASS_NAME_PREFIXES: Record<SubclassClass, string> = {
  Artificer: "",
  Berserker: "Path of the",
  "The Cheat": "Tools of the",
  Commander: "Champion of the",
  Hexbinder: "Coven of",
  Hunter: "Keeper of the",
  Mage: "Invoker of",
  Oathsworn: "Oauth of",
  Shadowmancer: "Pact of the",
  Shepherd: "Luminary of",
  Songweaver: "Herald of",
  Stormshifter: "Circle of",
  Zephyr: "Way of",
};

export interface SubclassAbility {
  id: string;
  name: string;
  description: string;
}

export interface SubclassLevel {
  level: number;
  abilities: SubclassAbility[];
}

export interface SubclassMini {
  id: string;
  name: string;
  className: SubclassClass;
  namePreface?: string;
  tagline?: string;
  visibility: SubclassVisibility;
  createdAt: Date;
}

export interface Subclass extends SubclassMini {
  description?: string;
  levels: SubclassLevel[];
  creator: User;
  updatedAt: Date;
}

export interface SubclassAbilityDb {
  id: string;
  subclassId: string;
  level: number;
  name: string;
  description: string;
  orderIndex: number;
}

export type SubclassSortOption =
  | "name-asc"
  | "name-desc"
  | "created-asc"
  | "created-desc";

export type SpellSchoolVisibility = "public" | "private";

export type SpellTarget =
  | { type: "self" }
  | {
      type: "single" | "single+" | "multi" | "special";
      kind: "range" | "reach";
      distance?: number;
    }
  | {
      type: "aoe";
      kind: "range" | "reach" | "line" | "cone";
      distance?: number;
    };

export interface SpellMini {
  id: string;
  name: string;
  tier: number;
  actions: number;
  target?: SpellTarget;
}

export interface Spell extends SpellMini {
  schoolId: string;
  reaction: boolean;
  damage?: string;
  description: string;
  highLevels?: string;
  concentration?: string;
  upcast?: string;
  createdAt: Date;
  updatedAt: Date;
  school?: SpellSchool;
}

export interface SpellSchoolMini {
  id: string;
  name: string;
  visibility: SpellSchoolVisibility;
  createdAt: Date;
}

export interface SpellSchool extends SpellSchoolMini {
  description?: string;
  spells: Spell[];
  creator: User;
  updatedAt: Date;
}

export type SpellSchoolSortOption =
  | "name-asc"
  | "name-desc"
  | "created-asc"
  | "created-desc";

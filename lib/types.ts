export const SIZES = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
] as const;
export type MonsterSize = (typeof SIZES)[number]["value"];

export const MONSTER_LEVELS = [
  { value: -4, label: "1/4", display: "1/4" },
  { value: -3, label: "1/3", display: "1/3" },
  { value: -2, label: "1/2", display: "1/2" },
  { value: 1, label: "1", display: "1" },
  { value: 2, label: "2", display: "2" },
  { value: 3, label: "3", display: "3" },
  { value: 4, label: "4", display: "4" },
  { value: 5, label: "5", display: "5" },
  { value: 6, label: "6", display: "6" },
  { value: 7, label: "7", display: "7" },
  { value: 8, label: "8", display: "8" },
  { value: 9, label: "9", display: "9" },
  { value: 10, label: "10", display: "10" },
  { value: 11, label: "11", display: "11" },
  { value: 12, label: "12", display: "12" },
  { value: 13, label: "13", display: "13" },
  { value: 14, label: "14", display: "14" },
  { value: 15, label: "15", display: "15" },
  { value: 16, label: "16", display: "16" },
  { value: 17, label: "17", display: "17" },
  { value: 18, label: "18", display: "18" },
  { value: 19, label: "19", display: "19" },
  { value: 20, label: "20", display: "20" },
] as const;

export const LEGENDARY_MONSTER_LEVELS = MONSTER_LEVELS.filter(
  (level) => level.value > 0
);
export const ALL_MONSTER_LEVELS = MONSTER_LEVELS;

export const ARMORS = [
  { value: "none", label: "None" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
] as const;
export type MonsterArmor = (typeof ARMORS)[number]["value"];

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

export const RARITIES = [
  { value: "unspecified", label: "Unspecified" },
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "very_rare", label: "Very Rare" },
  { value: "legendary", label: "Legendary" },
] as const;
export type ItemRarity = (typeof RARITIES)[number]["value"];
export type ItemRarityFilter = "all" | ItemRarity;

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

export interface MonsterMini {
  id: string;
  hp: number;
  kind?: string;
  legendary: boolean;
  minion: boolean;
  level: string;
  levelInt: number;
  name: string;
  size: MonsterSize;
  armor: MonsterArmor;
  visibility: "public" | "private";
  createdAt: Date;
}

export interface Monster extends MonsterMini {
  saves?: string;
  bloodied?: string;
  lastStand?: string;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  teleport: number;
  burrow: number;
  size: MonsterSize;
  abilities: Ability[];
  actions: Action[];
  actionPreface: string;
  moreInfo?: string;
  family?: FamilyOverview;
  creator: User;
  updatedAt: Date;
  imageUrl?: string;
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
  updatedAt: string;
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

export interface ItemMini {
  id: string;
  name: string;
  kind?: string;
  rarity: ItemRarity;
  visibility: "public" | "private";
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  imageBgColor?: string;
}

export interface Item extends ItemMini {
  description: string;
  moreInfo?: string;
  creator: User;
  updatedAt: string;
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
  { value: "Shadowmancer", label: "Shadowmancer" },
  { value: "Berserker", label: "Berserker" },
  { value: "The Cheat", label: "The Cheat" },
  { value: "Commander", label: "Commander" },
  { value: "Hunter", label: "Hunter" },
  { value: "Mage", label: "Mage" },
  { value: "Oathsworn", label: "Oathsworn" },
  { value: "Shepherd", label: "Shepherd" },
  { value: "Songweaver", label: "Songweaver" },
  { value: "Stormshifter", label: "Stormshifter" },
  { value: "Zephyr", label: "Zephyr" },
] as const;
export type SubclassClass = (typeof SUBCLASS_CLASSES)[number]["value"];

export const SUBCLASS_NAME_PREFIXES: Record<SubclassClass, string> = {
  Berserker: "Path of the",
  "The Cheat": "Tools of the",
  Commander: "Champion of the",
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

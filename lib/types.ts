export const SIZES = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
] as const;
export type MonsterSize = (typeof SIZES)[number]["value"];

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
  monsters?: MonsterMini[];
  monsterCount?: number;
  creatorId: string;
  creator?: User;
}

export interface Family extends FamilyOverview {
  monsters?: Monster[];
}

export interface MonsterMini {
  id: string;
  hp: number;
  legendary: boolean;
  level: string;
  name: string;
  visibility: "public" | "private";
}

export interface Monster extends MonsterMini {
  kind?: string;
  saves?: string;
  bloodied?: string;
  lastStand?: string;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  teleport: number;
  burrow: number;
  armor: MonsterArmor;
  size: MonsterSize;
  abilities: Ability[];
  actions: Action[];
  actionPreface: string;
  moreInfo?: string;
  family?: FamilyOverview;
  creator?: User;
  updatedAt: string;
  imageUrl?: string;
  conditions: MonsterCondition[];
}

export interface Condition {
  name: string;
  description: string;
  official: boolean;
}

export interface MonsterCondition extends Condition {
  inline: boolean;
}

/* FIXME: some families are serialized with Go-default capitalization */
export interface Ability {
  name: string;
  description: string;
  Name?: string;
  Description?: string;
}

export interface Action {
  name: string;
  damage?: string;
  range?: string;
  description?: string;
}

export interface Collection extends CollectionOverview {
  monsters: Monster[];
}

export interface CollectionOverview {
  id: string;
  creator: User;
  description?: string;
  legendaryCount: number;
  monsters: MonsterMini[];
  name: string;
  standardCount: number;
  visibility: CollectionVisibilityType;
  createdAt?: Date;
}

export interface User {
  discordId: string;
  avatar: string;
  username: string;
}

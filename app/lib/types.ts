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
  { value: "", label: "None" },
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
  CollectionVisibility.SECRET,
] as const;
export type CollectionVisibilityType =
  (typeof ValidCollectionVisibilities)[number];

export const FAMILY_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "secret", label: "Secret" },
  { value: "private", label: "Private" },
] as const;
export type FamilyVisibility = (typeof FAMILY_VISIBILITY)[number]["value"];

export interface Family {
  id: string;
  name: string;
  abilities: Ability[];
  monsterCount?: number;
  creatorId: string;
}

export interface Monster {
  visibility: "public" | "private";
  legendary: boolean;
  kind?: string;
  saves?: string;
  bloodied?: string;
  lastStand?: string;
  id: string;
  name: string;
  hp: number;
  speed: number;
  fly: number;
  swim: number;
  armor: MonsterArmor;
  size: MonsterSize;
  level: string;
  contributor?: string;
  abilities: Ability[];
  actions: Action[];
  actionPreface: string;
  moreInfo?: string;
  family?: Family;
  creator?: User;
  updatedAt: Date;
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

export interface Collection {
  id: string;
  name: string;
  creator: User;
  monsters: Monster[];
  legendaryCount: number;
  standardCount: number;
  visibility: CollectionVisibilityType;
  description?: string;
  createdAt?: Date | null;
}

export interface CollectionOverview {
  id: string;
  name: string;
  visibility: CollectionVisibilityType;
  legendaryCount: number;
  standardCount: number;
  creator: User;
}

export interface User {
  discordId: string;
  avatar: string;
  username: string;
}

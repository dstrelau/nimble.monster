export const SIZES = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
] as const;

export const ARMORS = [
  { value: "", label: "None" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
] as const;

export const COLLECTION_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "secret", label: "Secret" },
  { value: "private", label: "Private" },
] as const;

export type MonsterSize = (typeof SIZES)[number]["value"];
export type MonsterArmor = (typeof ARMORS)[number]["value"];
export type CollectionVisibility =
  (typeof COLLECTION_VISIBILITY)[number]["value"];

export interface Family {
  id: string;
  name: string;
  abilities: Ability[];
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
  family?: Family;
}

export interface Ability {
  name: string;
  description: string;
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
  creator: string;
  monsters: Monster[];
  monstersCount: number;
  visibility: CollectionVisibility;
  description?: string;
}

export interface User {
  discordId: string;
  avatar: string;
  username: string;
}

export const SIZES = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
] as const;

export const ARMORS = [
  { value: "none", label: "None" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
] as const;

export type MonsterSize = (typeof SIZES)[number]["value"];
export type MonsterArmor = (typeof ARMORS)[number]["value"];

export interface Family {
  name: string;
  description: string;
  ability?: Ability;
}

export interface Monster {
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
  public: boolean;
}

export interface User {
  discordId: string;
  avatar: string;
  username: string;
}

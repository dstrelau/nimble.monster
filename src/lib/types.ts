export type MonsterArmor = "none" | "medium" | "heavy";
export type MonsterSize =
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "huge"
  | "gargantuan";

export interface Family {
  name: string;
  description: string;
  ability?: Ability;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  speed: number;
  fly: number;
  swim: number;
  armor: MonsterArmor;
  size: MonsterSize;
  level: string;
  lastStand?: string;
  bloodied?: string;
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

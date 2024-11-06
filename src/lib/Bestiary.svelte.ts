export interface Monster {
  hp: number;
  speed: number;
  armor: string;
  level: string;
  name: string;
  slug: string;
  abilities: Ability[];
  attacks: Attack[];
}

export interface Family {
  name: string;
  description: string;
  ability: Ability;
  monsters: Monster[];
}

export interface Ability {
  name: string;
  description: string;
}

export interface Attack {
  name: string;
  damage: string;
  range: number;
  description: string;
}

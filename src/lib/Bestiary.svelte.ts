export interface Monster {
  name: string;
  slug: string;
  hp: number;
  speed: number;
  fly: number;
  swim: number;
  armor: string;
  level: string;
  abilities: Ability[];
  actions: Attack[];
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
  range: string;
  description: string;
}

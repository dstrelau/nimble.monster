export interface Monster {
  name: string;
  slug: string;
  hp: number;
  speed: number;
  fly: number;
  swim: number;
  armor: string;
  level: string;
  last_stand: string;
  bloodied: string;
  contributor: string;
  abilities: Ability[];
  actions: Attack[];
}

export interface Family {
  name: string;
  slug: string;
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

export interface SourceOption {
  id: string;
  name: string;
  abbreviation: string;
}

export type EntityType =
  | "monsters"
  | "ancestries"
  | "backgrounds"
  | "subclasses"
  | "spell_schools";

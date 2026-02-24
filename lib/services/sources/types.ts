export interface SourceOption {
  id: string;
  name: string;
  abbreviation: string;
}

export type EntityType =
  | "monsters"
  | "ancestries"
  | "backgrounds"
  | "classes"
  | "subclasses"
  | "spell_schools";

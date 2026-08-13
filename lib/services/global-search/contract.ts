export const GLOBAL_SEARCH_ENTITY_TYPES = [
  "monster",
  "hazard",
  "item",
  "companion",
  "ancestry",
  "background",
  "class",
  "subclass",
  "spellSchool",
  "collection",
  "encounter",
  "adventure",
  "family",
  "rule",
] as const;

export type GlobalSearchEntityType =
  (typeof GLOBAL_SEARCH_ENTITY_TYPES)[number];

export const GLOBAL_SEARCH_ENTITY_LABELS: Record<
  GlobalSearchEntityType,
  string
> = {
  monster: "Monsters",
  hazard: "Hazards",
  item: "Items",
  companion: "Companions",
  ancestry: "Ancestries",
  background: "Backgrounds",
  class: "Classes",
  subclass: "Subclasses",
  spellSchool: "Spell schools",
  collection: "Collections",
  encounter: "Encounters",
  adventure: "Adventures",
  family: "Families",
  rule: "Rules",
};

export interface GlobalSearchCreator {
  id: string;
  name: string;
  username?: string;
}

export interface GlobalSearchResult {
  type: GlobalSearchEntityType;
  id: string;
  name: string;
  subtitle?: string;
  href: string;
  creator?: GlobalSearchCreator;
  matchedField?: "name" | "keywords" | "summary" | "body";
}

export interface GlobalSearchFilters {
  types?: GlobalSearchEntityType[];
  creatorId?: string;
  limit?: number;
}

export interface GlobalSearchResponse {
  results: GlobalSearchResult[];
}

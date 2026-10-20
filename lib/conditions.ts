export const CONDITION_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface ConditionUsage {
  monsters: number;
  hazards: number;
  items: number;
  spells: number;
  companions: number;
  ancestries: number;
  backgrounds: number;
  families: number;
  classes: number;
  subclasses: number;
  spellSchools: number;
  collections: number;
  encounters: number;
  tables: number;
  rules: number;
  adventures: number;
}

export const CONDITION_USAGE_LABELS: {
  key: keyof ConditionUsage;
  singular: string;
  plural: string;
}[] = [
  { key: "monsters", singular: "monster", plural: "monsters" },
  { key: "hazards", singular: "hazard", plural: "hazards" },
  { key: "items", singular: "item", plural: "items" },
  { key: "spells", singular: "spell", plural: "spells" },
  { key: "companions", singular: "companion", plural: "companions" },
  { key: "ancestries", singular: "ancestry", plural: "ancestries" },
  { key: "backgrounds", singular: "background", plural: "backgrounds" },
  { key: "families", singular: "family", plural: "families" },
  { key: "classes", singular: "class", plural: "classes" },
  { key: "subclasses", singular: "subclass", plural: "subclasses" },
  { key: "spellSchools", singular: "spell school", plural: "spell schools" },
  { key: "collections", singular: "collection", plural: "collections" },
  { key: "encounters", singular: "encounter", plural: "encounters" },
  { key: "tables", singular: "reference table", plural: "reference tables" },
  { key: "rules", singular: "custom rule", plural: "custom rules" },
  { key: "adventures", singular: "adventure", plural: "adventures" },
];

export function extractConditions(text?: string): string[] {
  if (!text) {
    return [];
  }
  const matches = Array.from(text.matchAll(CONDITION_REGEX));
  return matches.map((match) => match[1].trim().toLowerCase());
}

export async function validateCondition(name: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/conditions/${encodeURIComponent(name)}`);
    return response.ok;
  } catch {
    return false;
  }
}

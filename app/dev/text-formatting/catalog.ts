export type RenderMode = "block" | "compact" | "prefixed";

export interface CatalogField {
  name: string;
  mode: RenderMode;
}

export interface CatalogEntity {
  entity: string;
  fields: CatalogField[];
}

export const FORMATTED_TEXT_ENTITY_CATALOG: CatalogEntity[] = [
  {
    entity: "Monster",
    fields: [
      { name: "Ability description", mode: "prefixed" },
      { name: "Action description", mode: "prefixed" },
      { name: "Bloodied", mode: "prefixed" },
      { name: "Last stand", mode: "prefixed" },
      { name: "More info", mode: "block" },
      { name: "Mild encounter guidance", mode: "block" },
      { name: "Spicy encounter guidance", mode: "block" },
    ],
  },
  {
    entity: "Hazard",
    fields: [
      { name: "Ability description", mode: "prefixed" },
      { name: "Action description", mode: "prefixed" },
      { name: "More info", mode: "block" },
      { name: "Mild encounter guidance", mode: "block" },
      { name: "Spicy encounter guidance", mode: "block" },
    ],
  },
  {
    entity: "Companion",
    fields: [
      { name: "Ability description", mode: "prefixed" },
      { name: "Action description", mode: "prefixed" },
      { name: "Dying rule", mode: "prefixed" },
      { name: "More info", mode: "block" },
    ],
  },
  {
    entity: "Item",
    fields: [
      { name: "Description", mode: "block" },
      { name: "More info", mode: "block" },
    ],
  },
  {
    entity: "Family",
    fields: [
      { name: "Description", mode: "block" },
      { name: "Ability description", mode: "prefixed" },
    ],
  },
  {
    entity: "Ancestry",
    fields: [
      { name: "Description", mode: "block" },
      { name: "Ability description", mode: "block" },
    ],
  },
  {
    entity: "Background",
    fields: [{ name: "Description", mode: "block" }],
  },
  {
    entity: "Class",
    fields: [
      { name: "Description", mode: "block" },
      { name: "Level ability", mode: "prefixed" },
      { name: "Ability-list description", mode: "block" },
      { name: "Ability-list item", mode: "prefixed" },
    ],
  },
  {
    entity: "Subclass",
    fields: [
      { name: "Tagline", mode: "compact" },
      { name: "Description", mode: "block" },
      { name: "Level ability", mode: "prefixed" },
      { name: "Ability-list description", mode: "block" },
      { name: "Ability-list item", mode: "prefixed" },
    ],
  },
  {
    entity: "Spell school",
    fields: [
      { name: "School description", mode: "block" },
      { name: "Spell description", mode: "compact" },
    ],
  },
  {
    entity: "Collection",
    fields: [
      { name: "Detail description", mode: "block" },
      { name: "Card-preview description", mode: "compact" },
    ],
  },
  {
    entity: "Encounter",
    fields: [
      { name: "Detail description", mode: "block" },
      { name: "Card-preview description", mode: "compact" },
    ],
  },
  {
    entity: "Adventure",
    fields: [{ name: "Text and callout node content", mode: "block" }],
  },
  {
    entity: "Custom rule",
    fields: [{ name: "Content", mode: "block" }],
  },
];

export interface CategoryMeta {
  slug: string;
  label: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "core-rules",
    label: "Core Rules",
    icon: "book-open",
    description:
      "Stats, skills, hit points, conditions, and fundamental game mechanics",
  },
  {
    slug: "combat",
    label: "Combat",
    icon: "sword",
    description: "Combat structure, actions, reactions, and tactical rules",
  },
  {
    slug: "magic",
    label: "Magic",
    icon: "sparkles",
    description: "Spellcasting and concentration rules",
  },
  {
    slug: "resting-downtime",
    label: "Resting & Downtime",
    icon: "map",
    description: "Field rests, downtime activities, and recovery",
  },
  {
    slug: "character-creation",
    label: "Character Creation",
    icon: "user",
    description: "Building and leveling up your hero",
  },
  {
    slug: "equipment",
    label: "Equipment",
    icon: "shield",
    description: "Equipment, wealth, and gear rules",
  },
  {
    slug: "gm-reference",
    label: "GM Reference",
    icon: "settings",
    description: "Monster building, encounter design, and GM tools",
  },
  {
    slug: "optional-rules",
    label: "Optional Rules",
    icon: "list",
    description: "Variant rules, measuring spaces, and glossary",
  },
  {
    slug: "more",
    label: "& More",
    icon: "ellipsis",
    description: "Glossary and variant rules",
  },
];

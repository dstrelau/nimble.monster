export interface CategoryMeta {
  slug: string;
  label: string;
  icon: string;
  description: string;
  /** Tailwind text color; `bg-current` reuses it for dots and bars. */
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "core-rules",
    label: "Core Rules",
    icon: "book-open",
    description: "Stats, skills, hit points, and fundamental game mechanics",
    color: "text-amber-700 dark:text-amber-500",
  },
  {
    slug: "combat",
    label: "Combat",
    icon: "sword",
    description: "Combat structure, actions, reactions, and tactical rules",
    color: "text-red-700 dark:text-red-500",
  },
  {
    slug: "magic",
    label: "Magic",
    icon: "sparkles",
    description: "Spellcasting and concentration rules",
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    slug: "resting-downtime",
    label: "Resting & Downtime",
    icon: "map",
    description: "Field rests, downtime activities, and recovery",
    color: "text-emerald-700 dark:text-emerald-500",
  },
  {
    slug: "character-creation",
    label: "Character Creation",
    icon: "user",
    description: "Building and leveling up your hero",
    color: "text-sky-700 dark:text-sky-500",
  },
  {
    slug: "equipment",
    label: "Equipment",
    icon: "shield",
    description: "Equipment, wealth, and gear rules",
    color: "text-orange-700 dark:text-orange-500",
  },
  {
    slug: "5e-conversion",
    label: "5e Conversion",
    icon: "book-open-check",
    description: "Using 5e adventures, monsters, spells, and characters",
    color: "text-indigo-700 dark:text-indigo-400",
  },
  {
    slug: "building-encounters",
    label: "Building Encounters",
    icon: "swords",
    description: "Encounter difficulty, pacing, balance, and variety",
    color: "text-cyan-700 dark:text-cyan-400",
  },
  {
    slug: "building-monsters",
    label: "Building Monsters",
    icon: "hammer",
    description: "Creating monsters, minions, flunkies, and abilities",
    color: "text-rose-800 dark:text-rose-400",
  },
  {
    slug: "legendary-monsters",
    label: "Legendary Monsters",
    icon: "crown",
    description: "Building and running legendary monsters",
    color: "text-fuchsia-700 dark:text-fuchsia-400",
  },
  {
    slug: "optional-rules",
    label: "Optional Rules",
    icon: "list",
    description: "Variant rules, measuring spaces, and glossary",
    color: "text-teal-700 dark:text-teal-500",
  },
  {
    slug: "more",
    label: "& More",
    icon: "ellipsis",
    description: "Glossary and variant rules",
    color: "text-stone-600 dark:text-stone-400",
  },
];

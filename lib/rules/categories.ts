export interface RuleSectionMeta {
  slug: string;
  label: string;
  ruleSlugs: string[];
}

export interface CategoryMeta {
  slug: string;
  label: string;
  icon: string;
  description: string;
  /** Tailwind text color; `bg-current` reuses it for dots and bars. */
  color: string;
  sections: RuleSectionMeta[];
}

export interface RuleGroupMeta {
  slug: string;
  label: string;
  description: string;
  categories: CategoryMeta[];
}

export interface RuleLocation {
  group: RuleGroupMeta;
  category: CategoryMeta;
  section: RuleSectionMeta;
  index: number;
}

export const RULE_GROUPS: RuleGroupMeta[] = [
  {
    slug: "rules",
    label: "Rules",
    description: "Core mechanics used by everyone at the table",
    categories: [
      {
        slug: "fundamentals",
        label: "Fundamentals",
        icon: "book-open",
        description: "Stats, checks, and health",
        color: "text-amber-700 dark:text-amber-500",
        sections: [
          {
            slug: "stats-skills-checks",
            label: "Stats, Skills & Checks",
            ruleSlugs: [
              "stats",
              "skills",
              "skill-checks",
              "advantage-disadvantage",
              "saves",
              "heroes-and-saves",
            ],
          },
          {
            slug: "health",
            label: "Health",
            ruleSlugs: [
              "hit-points-dying-wounds",
              "temporary-hp",
              "hit-dice",
              "wounds",
              "death",
            ],
          },
        ],
      },
      {
        slug: "characters-equipment",
        label: "Characters & Equipment",
        icon: "user",
        description: "Creating, advancing, and outfitting heroes",
        color: "text-sky-700 dark:text-sky-500",
        sections: [
          {
            slug: "creating-advancing",
            label: "Creating & Advancing a Hero",
            ruleSlugs: [
              "choose-your-class-ancestry-background",
              "the-character-sheet",
              "adventuring-motivation",
              "leveling-up",
            ],
          },
          {
            slug: "equipment-currency",
            label: "Equipment & Currency",
            ruleSlugs: [
              "equipment-proficiency",
              "armor-defense",
              "swapping-equipment",
              "healing-potions",
              "gold-currency",
            ],
          },
          {
            slug: "weapons",
            label: "Weapons",
            ruleSlugs: [
              "weapon-properties",
              "dual-wielding",
              "unarmed-strikes",
              "improvised-weapons",
              "customizing-weapons",
            ],
          },
        ],
      },
      {
        slug: "adventuring",
        label: "Adventuring",
        icon: "map",
        description: "Movement, recovery, downtime, and lodging",
        color: "text-emerald-700 dark:text-emerald-500",
        sections: [
          {
            slug: "movement-range-space",
            label: "Movement, Range & Space",
            ruleSlugs: [
              "movement",
              "falling-and-forced-movement",
              "size",
              "range-reach",
              "measuring-spaces",
              "diagonal-spaces",
              "cones-lines",
            ],
          },
          {
            slug: "rest-recovery",
            label: "Rest & Recovery",
            ruleSlugs: ["field-rests", "safe-rests"],
          },
          {
            slug: "downtime-lodging",
            label: "Downtime & Lodging",
            ruleSlugs: [
              "downtime",
              "example-downtime-activities",
              "lodging",
              "lodging-boons",
            ],
          },
        ],
      },
      {
        slug: "combat",
        label: "Combat",
        icon: "sword",
        description: "Encounter flow, actions, reactions, and positioning",
        color: "text-red-700 dark:text-red-500",
        sections: [
          {
            slug: "encounter-flow",
            label: "Encounter Flow",
            ruleSlugs: [
              "turns-rounds-encounters",
              "initiative",
              "turn-order",
              "surprise",
              "acting-over-multiple-turns",
            ],
          },
          {
            slug: "actions",
            label: "Actions",
            ruleSlugs: [
              "heroic-actions",
              "attack",
              "move",
              "cast-spell",
              "assess",
              "help",
            ],
          },
          {
            slug: "reactions",
            label: "Reactions",
            ruleSlugs: [
              "heroic-reactions",
              "defend",
              "interpose",
              "opportunity-attack",
            ],
          },
          {
            slug: "positioning-control",
            label: "Positioning & Control",
            ruleSlugs: ["cover", "hiding", "grappling"],
          },
        ],
      },
      {
        slug: "magic",
        label: "Magic",
        icon: "wand-sparkles",
        description: "Spellcasting, targeting, areas, and saves",
        color: "text-violet-600 dark:text-violet-400",
        sections: [
          {
            slug: "casting-spells",
            label: "Casting Spells",
            ruleSlugs: [
              "mana",
              "spell-schools",
              "upcasting",
              "secret-spells",
              "concentration",
            ],
          },
          {
            slug: "targets-areas-saves",
            label: "Targets, Areas & Saves",
            ruleSlugs: [
              "range-and-reach",
              "multi-target-area-of-effect-aoe",
              "save-spells",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "gm-guidance",
    label: "GM Guidance",
    description: "Tools for preparing, adapting, and running the game",
    categories: [
      {
        slug: "campaigns-rewards",
        label: "Campaigns & Rewards",
        icon: "coins",
        description: "Recovery, treasure, and campaign economy",
        color: "text-orange-700 dark:text-orange-500",
        sections: [
          {
            slug: "recovery-rewards",
            label: "Recovery & Rewards",
            ruleSlugs: [
              "resting-and-recovery",
              "how-much-gold",
              "too-much-gold",
              "on-buying-magical-items",
            ],
          },
        ],
      },
      {
        slug: "encounters",
        label: "Encounters",
        icon: "swords",
        description: "Difficulty, balance, pacing, and variety",
        color: "text-cyan-700 dark:text-cyan-400",
        sections: [
          {
            slug: "difficulty-balance",
            label: "Difficulty & Balance",
            ruleSlugs: [
              "encounter-difficulties",
              "monster-levels",
              "fine-tuning-difficulty",
              "balancing-with-tactics",
              "balancing-with-minions",
            ],
          },
          {
            slug: "pacing-variety",
            label: "Pacing & Variety",
            ruleSlugs: ["encounters-per-rest", "unique-encounters"],
          },
        ],
      },
      {
        slug: "monsters",
        label: "Monsters",
        icon: "goblin",
        description: "Building and running every kind of monster",
        color: "text-rose-800 dark:text-rose-400",
        sections: [
          {
            slug: "building-monsters",
            label: "Building Monsters",
            ruleSlugs: [
              "monster-builder",
              "default-monster-stats",
              "what-die-size-to-use",
              "monster-armor",
              "armor-variety",
              "flavorful-monster-abilities",
            ],
          },
          {
            slug: "minions-flunkies",
            label: "Minions & Flunkies",
            ruleSlugs: [
              "minions",
              "flunkies",
              "suggested-minion-die-size-by-party-level",
            ],
          },
          {
            slug: "legendary-monsters",
            label: "Legendary Monsters",
            ruleSlugs: [
              "legendary-monster-builder",
              "legendary-saves",
              "legendary-bloodied",
              "running-legendary-monsters",
              "optional-actions",
              "last-stand",
            ],
          },
        ],
      },
      {
        slug: "5e-conversion",
        label: "5e Conversion",
        icon: "book-open-check",
        description: "Using 5e adventures, creatures, and player content",
        color: "text-indigo-700 dark:text-indigo-400",
        sections: [
          {
            slug: "adventures-adjudication",
            label: "Adventures & Adjudication",
            ruleSlugs: [
              "adventures",
              "skill-checks-in-5e",
              "saving-throws",
              "conditions-in-5e",
              "optional-tweaks",
            ],
          },
          {
            slug: "creatures-content",
            label: "Creatures & Content",
            ruleSlugs: [
              "monsters",
              "5e-legendary-monsters",
              "monster-skill-checks",
              "5e-races-classes",
              "5e-spells",
              "5e-magical-items",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "reference",
    label: "Reference",
    description: "Indexes and lookup material",
    categories: [
      {
        slug: "lookup",
        label: "Reference",
        icon: "list",
        description: "Conditions, glossary, and official variant index",
        color: "text-stone-600 dark:text-stone-400",
        sections: [
          {
            slug: "indexes",
            label: "Indexes",
            ruleSlugs: ["conditions", "glossary", "variant-rules"],
          },
        ],
      },
    ],
  },
];

export const CATEGORIES = RULE_GROUPS.flatMap((group) => group.categories);

const locations = new Map<string, RuleLocation>();
const navigationSlugs = new Set<string>();
for (const group of RULE_GROUPS) {
  if (navigationSlugs.has(group.slug)) {
    throw new Error(`Duplicate rule navigation slug ${group.slug}`);
  }
  navigationSlugs.add(group.slug);
  for (const category of group.categories) {
    if (navigationSlugs.has(category.slug)) {
      throw new Error(`Duplicate rule navigation slug ${category.slug}`);
    }
    navigationSlugs.add(category.slug);
    for (const section of category.sections) {
      if (navigationSlugs.has(section.slug)) {
        throw new Error(`Duplicate rule navigation slug ${section.slug}`);
      }
      if (section.ruleSlugs.length === 0) {
        throw new Error(`Rule section ${section.slug} must not be empty`);
      }
      navigationSlugs.add(section.slug);
      for (const [index, ruleSlug] of section.ruleSlugs.entries()) {
        if (locations.has(ruleSlug)) {
          throw new Error(`Rule hierarchy assigns ${ruleSlug} more than once`);
        }
        locations.set(ruleSlug, { group, category, section, index });
      }
    }
  }
}

export function getRuleLocation(slug: string): RuleLocation | null {
  return locations.get(slug) ?? null;
}

export function validateRuleHierarchy(
  rules: { slug: string; variantOf?: string }[]
): void {
  const bySlug = new Map(rules.map((rule) => [rule.slug, rule]));
  for (const ruleSlug of locations.keys()) {
    const rule = bySlug.get(ruleSlug);
    if (!rule)
      throw new Error(`Rule hierarchy references unknown rule ${ruleSlug}`);
    if (rule.variantOf) {
      throw new Error(`Rule hierarchy must not assign variant ${ruleSlug}`);
    }
  }
  const missing = rules
    .filter((rule) => !rule.variantOf && !locations.has(rule.slug))
    .map((rule) => rule.slug);
  if (missing.length > 0) {
    throw new Error(`Rule hierarchy is missing: ${missing.join(", ")}`);
  }
}

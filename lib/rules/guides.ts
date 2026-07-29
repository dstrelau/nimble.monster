import { CATEGORIES, type CategoryMeta } from "./categories";
import { getRule, type Rule } from "./filesystem";

export interface GuideMeta {
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  /** Reading order, by rule slug. */
  ruleSlugs: string[];
}

// Hand-curated reading orders over existing rules. There is no authoring UI;
// edit this list to change a guide.
export const GUIDES: GuideMeta[] = [
  {
    slug: "how-combat-works",
    title: "How combat works",
    summary: "Learn the flow of turns, actions, attacks, and reactions.",
    categorySlug: "combat",
    ruleSlugs: [
      "turns-rounds-encounters",
      "initiative",
      "turn-order",
      "heroic-actions",
      "attack",
      "move",
      "heroic-reactions",
      "advantage-disadvantage",
      "cover",
    ],
  },
  {
    slug: "taking-damage-and-dying",
    title: "Taking damage & dying",
    summary: "Understand hit points, wounds, dying, and death.",
    categorySlug: "core-rules",
    ruleSlugs: [
      "hit-points-dying-wounds",
      "conditions",
      "wounds",
      "death",
      "temporary-hp",
    ],
  },
  {
    slug: "casting-your-first-spell",
    title: "Casting your first spell",
    summary: "Use mana, cast spells, upcast, and maintain concentration.",
    categorySlug: "magic",
    ruleSlugs: [
      "mana",
      "cast-spell",
      "spell-schools",
      "upcasting",
      "save-spells",
      "range-and-reach",
      "concentration",
    ],
  },
  {
    slug: "travel-and-the-wilds",
    title: "Travel & the wilds",
    summary: "Navigate movement, distance, rests, and downtime.",
    categorySlug: "resting-downtime",
    ruleSlugs: [
      "movement",
      "falling-and-forced-movement",
      "measuring-spaces",
      "diagonal-spaces",
      "range-reach",
      "field-rests",
      "safe-rests",
      "downtime",
    ],
  },
  {
    slug: "making-a-character",
    title: "Making a character",
    summary: "Choose a class and ancestry, then finish your hero.",
    categorySlug: "character-creation",
    ruleSlugs: [
      "choose-your-class-ancestry-background",
      "the-character-sheet",
      "leveling-up",
    ],
  },
];

export interface Guide extends GuideMeta {
  category: CategoryMeta;
  /** Rules in reading order. */
  rules: Rule[];
  href: string;
}

export function guideUrl(slug: string): string {
  return `/rules/guide/${slug}`;
}

function resolve(guide: GuideMeta): Guide | null {
  const category = CATEGORIES.find(
    (candidate) => candidate.slug === guide.categorySlug
  );
  if (!category) {
    throw new Error(`Unknown guide category: ${guide.categorySlug}`);
  }
  const rules = guide.ruleSlugs.flatMap((slug) => {
    const rule = getRule(slug);
    return rule ? [rule] : [];
  });
  if (rules.length === 0) return null;
  return {
    ...guide,
    category,
    rules,
    href: guideUrl(guide.slug),
  };
}

export function getGuides(): Guide[] {
  return GUIDES.flatMap((guide) => resolve(guide) ?? []);
}

export function getGuide(slug: string): Guide | null {
  const guide = GUIDES.find((g) => g.slug === slug);
  return guide ? resolve(guide) : null;
}

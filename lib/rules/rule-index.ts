import { CATEGORIES, type CategoryMeta } from "./categories";
import type { Rule } from "./filesystem";

export interface CategoryGroup {
  category: CategoryMeta;
  rules: Rule[];
}

export function ruleUrl(slug: string): string {
  return `/rules/${slug}`;
}

export function variantAnchor(slug: string): string {
  return `variant-${slug}`;
}

export function variantParentUrl(
  parentSlug: string,
  variantSlug: string
): string {
  return `${ruleUrl(parentSlug)}#${variantAnchor(variantSlug)}`;
}

export function groupByCategory(rules: Rule[]): CategoryGroup[] {
  return CATEGORIES.flatMap((category) => {
    const group = rules.filter(
      (r) => r.category === category.slug && !r.variantOf
    );
    return group.length > 0 ? [{ category, rules: group }] : [];
  });
}

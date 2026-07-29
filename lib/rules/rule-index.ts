import {
  type CategoryMeta,
  RULE_GROUPS,
  type RuleGroupMeta,
  type RuleSectionMeta,
  validateRuleHierarchy,
} from "./categories";
import type { Rule } from "./filesystem";

export interface ResolvedRuleSection {
  section: RuleSectionMeta;
  rules: Rule[];
}

export interface ResolvedCategory {
  category: CategoryMeta;
  sections: ResolvedRuleSection[];
}

export interface ResolvedRuleGroup {
  group: RuleGroupMeta;
  categories: ResolvedCategory[];
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

export function resolveRuleHierarchy(rules: Rule[]): ResolvedRuleGroup[] {
  validateRuleHierarchy(rules);
  const bySlug = new Map(rules.map((rule) => [rule.slug, rule]));
  return RULE_GROUPS.map((group) => ({
    group,
    categories: group.categories.map((category) => ({
      category,
      sections: category.sections.map((section) => ({
        section,
        rules: section.ruleSlugs.flatMap((slug) => {
          const rule = bySlug.get(slug);
          return rule ? [rule] : [];
        }),
      })),
    })),
  }));
}

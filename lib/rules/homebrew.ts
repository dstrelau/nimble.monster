import { getRule } from "./filesystem";

interface Linked {
  links: { ruleSlug: string }[];
}

/**
 * Bucket homebrew rules by the categories of the official rules they link to.
 * A rule touching two categories appears under both; one with no links is
 * absent, since it has no category to file under.
 */
export function groupHomebrewByCategory<T extends Linked>(
  rules: T[]
): Map<string, T[]> {
  const byCategory = new Map<string, T[]>();
  for (const rule of rules) {
    const categories = new Set(
      rule.links.flatMap((link) => {
        const target = getRule(link.ruleSlug);
        return target ? [target.category] : [];
      })
    );
    for (const category of categories) {
      const list = byCategory.get(category) ?? [];
      list.push(rule);
      byCategory.set(category, list);
    }
  }
  return byCategory;
}

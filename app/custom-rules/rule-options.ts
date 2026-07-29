import type { Option, OptionGroup } from "@/components/ui/multi-select";
import { CATEGORIES } from "@/lib/rules/categories";
import { getAllRules } from "@/lib/rules/filesystem";

// Options for the official-rule picker, grouped and ordered by category.
// Flat rule titles are unique (enforced in lib/rules/filesystem), so the label
// is just the title — no page prefix needed to disambiguate.
export function buildRuleGroups(): OptionGroup[] {
  const byCategory = new Map<string, Option[]>();
  for (const rule of getAllRules()) {
    const list = byCategory.get(rule.category) ?? [];
    list.push({ value: rule.slug, label: rule.title });
    byCategory.set(rule.category, list);
  }
  return CATEGORIES.flatMap((category) => {
    const options = byCategory.get(category.slug);
    return options?.length ? [{ label: category.label, options }] : [];
  });
}

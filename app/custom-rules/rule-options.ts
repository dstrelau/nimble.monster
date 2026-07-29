import type { ComboboxGroup, ComboboxItem } from "@/components/ui/combobox";
import { CATEGORIES } from "@/lib/rules/categories";
import { getAllRules } from "@/lib/rules/filesystem";

// Options for the official-rule picker, grouped and ordered by category.
// Flat rule titles are unique (enforced in lib/rules/filesystem), so the label
// is just the title — no page prefix needed to disambiguate.
export function buildRuleGroups(): ComboboxGroup<ComboboxItem>[] {
  const byCategory = new Map<string, ComboboxItem[]>();
  for (const rule of getAllRules()) {
    const list = byCategory.get(rule.category) ?? [];
    list.push({ id: rule.slug, label: rule.title });
    byCategory.set(rule.category, list);
  }
  return CATEGORIES.flatMap((category) => {
    const items = byCategory.get(category.slug);
    return items?.length ? [{ heading: category.label, items }] : [];
  });
}

import type { Option, OptionGroup } from "@/components/ui/multi-select";
import { CATEGORIES } from "@/lib/reference/categories";
import {
  getAllSections,
  getPageForSection,
  getSectionBySlug,
} from "@/lib/reference/filesystem";

// A disambiguated label for a section. Many sections share generic titles
// ("Intro", "Overview"), so we prefix the owning page. A lead section whose
// slug equals its page slug is the page itself, so just use the page title.
function sectionLabel(
  pageSlug: string,
  pageTitle: string,
  sectionSlug: string,
  sectionTitle: string
): string {
  return sectionSlug === pageSlug
    ? pageTitle
    : `${pageTitle} — ${sectionTitle}`;
}

// Builds the reference-section picker options (all 141 sections), grouped and
// ordered by reference category. Reads the filesystem (the display source of
// truth).
export function buildSectionGroups(): OptionGroup[] {
  const optionsByCategory = new Map<string, Option[]>();

  for (const section of getAllSections()) {
    const page = getPageForSection(section.slug);
    if (!page) continue;
    const list = optionsByCategory.get(page.category) ?? [];
    list.push({
      value: section.slug,
      label: sectionLabel(page.slug, page.title, section.slug, section.title),
    });
    optionsByCategory.set(page.category, list);
  }

  return CATEGORIES.map((category) => ({
    label: category.label,
    options: (optionsByCategory.get(category.slug) ?? []).sort((a, b) =>
      a.label.localeCompare(b.label)
    ),
  })).filter((group) => group.options.length > 0);
}

// Maps a section slug to a disambiguated display title (page + section title).
export function referenceSectionTitle(sectionSlug: string): string {
  const section = getSectionBySlug(sectionSlug);
  const page = getPageForSection(sectionSlug);
  if (!section || !page) return sectionSlug;
  return sectionLabel(page.slug, page.title, section.slug, section.title);
}

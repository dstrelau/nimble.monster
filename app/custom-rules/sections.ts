import type { OptionGroup } from "@/components/ui/multi-select";
import { CATEGORIES } from "@/lib/reference/categories";
import { getAllReferenceFrontmatter } from "@/lib/reference/filesystem";

// Builds the reference-section picker options, grouped and ordered by the
// reference categories. Reads the filesystem (the display source of truth).
export function buildSectionGroups(): OptionGroup[] {
  const entries = getAllReferenceFrontmatter();
  return CATEGORIES.map((category) => ({
    label: category.label,
    options: entries
      .filter((entry) => entry.category === category.slug)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((entry) => ({ value: entry.slug, label: entry.title })),
  })).filter((group) => group.options.length > 0);
}

// Maps a reference slug (optionally "slug#anchor") to a display title.
export function referenceSectionTitle(sectionSlug: string): string {
  const [slug, anchor] = sectionSlug.split("#");
  const entry = getAllReferenceFrontmatter().find((e) => e.slug === slug);
  const title = entry?.title ?? slug;
  return anchor ? `${title} (${anchor})` : title;
}

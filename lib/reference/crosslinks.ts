import { getSpellSchoolUrlsByName } from "@/lib/db/school";

import { termIndex } from "./terms";

const DICE_PLACEHOLDER = /\{\{dice:([^}]+)\}\}/g;
const SPELL_SCHOOL_PLACEHOLDER = /\{\{spell-school:([^}]+)\}\}/g;
const TERM_PLACEHOLDER = /\{\{term:([^}]+)\}\}/g;

/**
 * Resolve {{spell-school:Name}} placeholders by looking up spell school URLs
 * from the database. Returns markdown with placeholders replaced by links.
 */
export async function resolveSpellSchoolLinks(
  markdown: string
): Promise<string> {
  const names: string[] = [];
  for (const match of markdown.matchAll(SPELL_SCHOOL_PLACEHOLDER)) {
    names.push(match[1]);
  }
  if (names.length === 0) return markdown;

  const urlMap = await getSpellSchoolUrlsByName(names);

  return markdown.replace(SPELL_SCHOOL_PLACEHOLDER, (_full, name: string) => {
    const url = urlMap.get(name);
    return url ? `[${name}](${url})` : name;
  });
}

/**
 * Replace {{dice:NOTATION}} placeholders with markdown links that
 * ReferenceMarkdown renders as interactive DiceNotation components.
 */
export function resolveDiceNotationLinks(markdown: string): string {
  return markdown.replace(DICE_PLACEHOLDER, (_full, dice: string) => {
    return `[${dice}](/dice/${encodeURIComponent(dice)})`;
  });
}

/**
 * Replace {{term:Name}} placeholders with markdown links using the YAML term index.
 */
export function resolveTermLinks(markdown: string): string {
  return markdown.replace(TERM_PLACEHOLDER, (_full, name: string) => {
    const entry = termIndex.get(name.toLowerCase());
    return entry ? `[${name}](${entry.href})` : name;
  });
}

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Rule {
  /** Flat, content-matching slug. Also the URL: /rules/<slug>. */
  slug: string;
  title: string;
  /** One of the CATEGORIES slugs. */
  category: string;
  content: string;
  sources?: RuleSource[];
  variantOf?: string;
}

export interface RuleSource {
  book: "Core Rules" | "GMG";
  pages?: number[];
}

const RULES_DIR = join(process.cwd(), "data/rules");

function parsePages(slug: string, value: string): number[] {
  const match = value.match(/^\[([^\]]*)\]$/);
  if (!match) throw new Error(`${slug}.mdx: malformed source pages`);
  const pages = match[1].split(",").map((page) => Number(page.trim()));
  if (
    pages.length === 0 ||
    pages.some((page) => !Number.isInteger(page) || page <= 0)
  ) {
    throw new Error(`${slug}.mdx: source pages must be positive integers`);
  }
  return pages;
}

function parseSources(
  slug: string,
  frontmatter: string
): RuleSource[] | undefined {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => /^sources\s*:/.test(line));
  if (start < 0) return undefined;
  if (lines[start].trim() !== "sources:") {
    throw new Error(`${slug}.mdx: malformed sources`);
  }

  const sources: RuleSource[] = [];
  let index = start + 1;
  while (index < lines.length && /^\s/.test(lines[index])) {
    const bookMatch = lines[index].match(/^\s{2}- book:\s*"([^"]+)"\s*$/);
    if (!bookMatch) throw new Error(`${slug}.mdx: malformed source entry`);
    const book = bookMatch[1];
    if (book !== "Core Rules" && book !== "GMG") {
      throw new Error(
        `${slug}.mdx: unknown source book ${JSON.stringify(book)}`
      );
    }
    index += 1;
    const pagesMatch = lines[index]?.match(/^\s{4}pages:\s*(.+)$/);
    if (pagesMatch) {
      sources.push({ book, pages: parsePages(slug, pagesMatch[1].trim()) });
      index += 1;
    } else {
      sources.push({ book });
    }
  }
  if (sources.length === 0)
    throw new Error(`${slug}.mdx: sources must not be empty`);
  return sources;
}

export function parseRule(slug: string, raw: string): Rule {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${slug}.mdx: missing frontmatter`);
  const [, frontmatter, content] = match;
  const field = (name: string): string => {
    const m = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
    if (!m) throw new Error(`${slug}.mdx: missing ${name}`);
    return m[1].trim().replace(/^"(.*)"$/, "$1");
  };
  const sources = parseSources(slug, frontmatter);
  const variantMatch = frontmatter.match(/^variantOf:\s*(.+)$/m);
  const variantOf = variantMatch?.[1].trim().replace(/^"(.*)"$/, "$1");
  if (variantMatch && !variantOf?.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
    throw new Error(`${slug}.mdx: malformed variantOf`);
  }
  return {
    slug,
    title: field("title"),
    category: field("category"),
    content: content.trim(),
    ...(sources ? { sources } : {}),
    ...(variantOf ? { variantOf } : {}),
  };
}

export function validateRuleVariants(rules: Rule[]): void {
  const bySlug = new Map(rules.map((rule) => [rule.slug, rule]));
  for (const rule of rules) {
    if (!rule.variantOf) continue;
    const parent = bySlug.get(rule.variantOf);
    if (!parent) {
      throw new Error(
        `${rule.slug}.mdx: unknown variant parent "${rule.variantOf}"`
      );
    }
    if (parent.variantOf) {
      throw new Error(`${rule.slug}.mdx: variant parent must not be a variant`);
    }
  }
}

function load(): { all: Rule[]; bySlug: Map<string, Rule> } {
  const all = readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) =>
      parseRule(f.slice(0, -4), readFileSync(join(RULES_DIR, f), "utf-8"))
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  const bySlug = new Map(all.map((r) => [r.slug, r]));
  validateRuleVariants(all);
  // Filenames are the slugs, so the filesystem guarantees uniqueness. Titles
  // do not get that for free, and duplicates render as indistinguishable rows.
  const titles = new Map<string, string>();
  for (const rule of all) {
    const key = rule.title.toLowerCase();
    const prev = titles.get(key);
    if (prev) {
      throw new Error(
        `Duplicate rule title ${JSON.stringify(rule.title)} in ${prev}.mdx and ${rule.slug}.mdx`
      );
    }
    titles.set(key, rule.slug);
  }
  return { all, bySlug };
}

let cache: ReturnType<typeof load> | null = null;
const data = () => {
  cache ??= load();
  return cache;
};

export function getAllRules(): Rule[] {
  return data().all;
}

export function getRule(slug: string): Rule | null {
  return data().bySlug.get(slug) ?? null;
}

export function getRuleVariants(
  parentSlug: string,
  rules: Rule[] = data().all
): Rule[] {
  return rules
    .filter((rule) => rule.variantOf === parentSlug)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getValidRuleSlugs(): Set<string> {
  return new Set(data().bySlug.keys());
}

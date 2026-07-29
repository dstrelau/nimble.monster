import { getAllRules, type Rule } from "./filesystem";
import { headingId } from "./headings";

export interface RuleSearchResult {
  slug: string;
  title: string;
  category: string;
  variantOf?: string;
  /** Heading ID for a result within a combined rule. */
  anchor?: string;
  /** Excerpt with matches wrapped in <mark>. Safe: only <mark> is emitted. */
  excerpt: string;
}

interface SearchEntry {
  title: string;
  content: string;
  anchor?: string;
}

const EXCERPT_CHARS = 160;

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// Plain text for matching and excerpting: strip markdown syntax and the
// {{term:X}} / {{dice:X}} crosslink placeholders, keeping their visible text.
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/\{\{\w+:([^}]+)\}\}/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^[>#\-*|]+\s*/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreRule(rule: Rule, plain: string, tokens: string[]): number {
  const title = rule.title.toLowerCase();
  const body = plain.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title === token) score += 100;
    else if (title.startsWith(token)) score += 50;
    else if (title.includes(token)) score += 25;
    const hits = body.split(token).length - 1;
    if (hits === 0 && !title.includes(token)) return 0; // every token must appear
    score += Math.min(hits, 5);
  }
  return score;
}

// Window the plain text around the first match and wrap every token hit in
// <mark>. HTML-escapes first, so the only tags in the output are the marks.
export function buildExcerpt(plain: string, tokens: string[]): string {
  const lower = plain.toLowerCase();
  const first = tokens
    .map((t) => lower.indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  const start =
    first === undefined ? 0 : Math.max(0, first - EXCERPT_CHARS / 3);
  const slice = plain.slice(start, start + EXCERPT_CHARS);
  const text =
    (start > 0 ? "…" : "") +
    escapeHtml(slice) +
    (start + EXCERPT_CHARS < plain.length ? "…" : "");
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  return text.replace(pattern, "<mark>$1</mark>");
}

function sectionEntries(content: string): SearchEntry[] {
  const headings = [...content.matchAll(/^#{2,6}\s+(.+)$/gm)];
  return headings.map((heading, index) => {
    const title = heading[1].trim();
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? content.length;
    return {
      title,
      content: `${title} ${content.slice(start, end)}`,
      anchor: headingId(title),
    };
  });
}

export function searchRuleSet(
  rules: Rule[],
  query: string,
  limit = 30
): RuleSearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return rules
    .flatMap((rule) => {
      const sections = sectionEntries(rule.content)
        .map((entry) => {
          const plain = toPlainText(entry.content);
          const sectionRule = { ...rule, title: entry.title };
          return {
            rule: sectionRule,
            plain,
            anchor: entry.anchor,
            score: scoreRule(sectionRule, plain, tokens),
          };
        })
        .filter((entry) => entry.score > 0);
      if (sections.length > 0) return sections;

      const plain = toPlainText(rule.content);
      return [
        {
          rule,
          plain,
          anchor: undefined,
          score: scoreRule(rule, plain, tokens),
        },
      ];
    })
    .filter((r) => r.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.rule.title.localeCompare(b.rule.title)
    )
    .slice(0, limit)
    .map(({ rule, plain, anchor }) => ({
      slug: rule.slug,
      title: rule.title,
      category: rule.category,
      ...(rule.variantOf ? { variantOf: rule.variantOf } : {}),
      anchor,
      excerpt: buildExcerpt(plain, tokens),
    }));
}

export function searchRules(query: string, limit = 30): RuleSearchResult[] {
  return searchRuleSet(getAllRules(), query, limit);
}

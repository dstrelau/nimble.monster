import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getAllRules,
  parseKeywords,
  parseSources,
  type RuleSource,
} from "./filesystem";
import { headingId } from "./headings";

export type RuleFaqKind = "official" | "common";

export interface RuleFaqTarget {
  ruleSlug: string;
  anchor?: string;
}

export interface RuleFaq {
  slug: string;
  question: string;
  kind: RuleFaqKind;
  targets: RuleFaqTarget[];
  answer: string;
  keywords: string[];
  sources: RuleSource[];
}

export interface RuleFaqPlacement {
  faq: RuleFaq;
  target: RuleFaqTarget;
}

export interface RuleContentSection {
  content: string;
  anchor?: string;
}

const FAQS_DIR = join(process.cwd(), "data/rules/faqs");

function parseTargets(slug: string, value: string): RuleFaqTarget[] {
  const match = value.match(/^\[([^\]]*)\]$/);
  if (!match) throw new Error(`${slug}.mdx: malformed targets`);
  const targets = match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const targetMatch = value.match(
        /^([a-z0-9]+(?:-[a-z0-9]+)*)(?:#([a-z0-9]+(?:-[a-z0-9]+)*))?$/
      );
      if (!targetMatch) throw new Error(`${slug}.mdx: malformed target`);
      return {
        ruleSlug: targetMatch[1],
        ...(targetMatch[2] ? { anchor: targetMatch[2] } : {}),
      };
    });
  if (targets.length === 0) {
    throw new Error(`${slug}.mdx: targets must not be empty`);
  }
  return targets;
}

export function parseRuleFaq(slug: string, raw: string): RuleFaq {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${slug}.mdx: missing frontmatter`);
  const [, frontmatter, rawAnswer] = match;
  const field = (name: string): string => {
    const fieldMatch = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
    if (!fieldMatch) throw new Error(`${slug}.mdx: missing ${name}`);
    return fieldMatch[1].trim().replace(/^"(.*)"$/, "$1");
  };
  const question = field("question");
  const kind = field("kind");
  if (kind !== "official" && kind !== "common") {
    throw new Error(`${slug}.mdx: unknown FAQ kind ${JSON.stringify(kind)}`);
  }
  const answer = rawAnswer.trim();
  if (!question || !answer) {
    throw new Error(`${slug}.mdx: question and answer must not be empty`);
  }
  const sources = parseSources(slug, frontmatter);
  if (!sources) {
    throw new Error(`${slug}.mdx: missing sources`);
  }
  const keywords = parseKeywords(slug, frontmatter);
  return {
    slug,
    question,
    kind,
    targets: parseTargets(slug, field("targets")),
    answer,
    keywords,
    sources,
  };
}

export function splitRuleContent(content: string): RuleContentSection[] {
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];
  if (headings.length === 0) return [{ content }];

  const sections: RuleContentSection[] = [];
  const introduction = content.slice(0, headings[0].index).trim();
  if (introduction) sections.push({ content: introduction });
  for (const [index, heading] of headings.entries()) {
    const start = heading.index ?? 0;
    const end = headings[index + 1]?.index ?? content.length;
    sections.push({
      content: content.slice(start, end).trim(),
      anchor: headingId(heading[1].trim()),
    });
  }
  return sections;
}

export function validateRuleFaqs(faqs: RuleFaq[]): void {
  const rules = new Map(getAllRules().map((rule) => [rule.slug, rule]));
  const seen = new Set<string>();
  for (const faq of faqs) {
    if (seen.has(faq.slug)) throw new Error(`Duplicate FAQ slug ${faq.slug}`);
    seen.add(faq.slug);
    for (const target of faq.targets) {
      const rule = rules.get(target.ruleSlug);
      if (!rule) {
        throw new Error(
          `${faq.slug}.mdx: unknown target rule "${target.ruleSlug}"`
        );
      }
      if (
        target.anchor &&
        !splitRuleContent(rule.content).some(
          (section) => section.anchor === target.anchor
        )
      ) {
        throw new Error(
          `${faq.slug}.mdx: unknown target section "${target.ruleSlug}#${target.anchor}"`
        );
      }
    }
  }
}

function load(): RuleFaq[] {
  const faqs = readdirSync(FAQS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) =>
      parseRuleFaq(
        file.slice(0, -4),
        readFileSync(join(FAQS_DIR, file), "utf-8")
      )
    )
    .sort((a, b) => a.question.localeCompare(b.question));
  validateRuleFaqs(faqs);
  return faqs;
}

let cache: RuleFaq[] | null = null;
const data = () => {
  cache ??= load();
  return cache;
};

export function getAllRuleFaqs(): RuleFaq[] {
  return data();
}

export function getRuleFaqs(ruleSlug: string): RuleFaqPlacement[] {
  return data().flatMap((faq) => {
    const target = faq.targets.find((target) => target.ruleSlug === ruleSlug);
    return target ? [{ faq, target }] : [];
  });
}

export function ruleFaqAnchor(slug: string): string {
  return `faq-${slug}`;
}

export function ruleFaqUrl(faq: RuleFaq): string {
  const target = faq.targets[0];
  const rule = getAllRules().find((rule) => rule.slug === target.ruleSlug);
  const pageSlug = rule?.variantOf ?? target.ruleSlug;
  return `/rules/${pageSlug}#${ruleFaqAnchor(faq.slug)}`;
}

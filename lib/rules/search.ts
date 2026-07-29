import { getRuleLocation } from "./categories";
import { getAllRuleFaqs, type RuleFaqKind, ruleFaqAnchor } from "./faqs";
import { getAllRules, type Rule } from "./filesystem";
import { scoreKeywordMatch } from "./keyword-search";

export interface RuleSearchResult {
  slug: string;
  title: string;
  category: string;
  group?: string;
  variantOf?: string;
  faqKind?: RuleFaqKind;
  anchor?: string;
  href?: string;
  customRule?: boolean;
}

export function searchRuleSet(
  rules: Rule[],
  query: string,
  limit = 30
): RuleSearchResult[] {
  return rules
    .map((rule) => ({
      rule,
      score: scoreKeywordMatch(rule.title, rule.keywords, query),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || a.rule.title.localeCompare(b.rule.title)
    )
    .slice(0, limit)
    .map(({ rule }) => ({
      slug: rule.slug,
      title: rule.title,
      category: rule.category,
      ...(rule.variantOf ? { variantOf: rule.variantOf } : {}),
    }));
}

export function searchRules(query: string, limit = 30): RuleSearchResult[] {
  const rules = getAllRules();
  const bySlug = new Map(rules.map((rule) => [rule.slug, rule]));
  const ranked = [
    ...searchRuleSet(rules, query, limit).map((result) => ({
      result,
      score: scoreKeywordMatch(
        result.title,
        bySlug.get(result.slug)?.keywords ?? [],
        query
      ),
    })),
    ...getAllRuleFaqs().flatMap((faq) => {
      const target = bySlug.get(faq.targets[0].ruleSlug);
      const score = scoreKeywordMatch(faq.question, faq.keywords, query);
      return target && score
        ? [
            {
              result: {
                slug: target.variantOf ?? target.slug,
                title: faq.question,
                category: target.category,
                faqKind: faq.kind,
                anchor: ruleFaqAnchor(faq.slug),
              },
              score,
            },
          ]
        : [];
    }),
  ];
  return ranked
    .sort(
      (a, b) =>
        b.score - a.score || a.result.title.localeCompare(b.result.title)
    )
    .slice(0, limit)
    .map(({ result }) => {
      const group = getRuleLocation(result.slug)?.group.slug;
      return { ...result, ...(group ? { group } : {}) };
    });
}

"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getPublicCustomRulesForRules } from "@/app/custom-rules/actions";
import type { CustomRuleReverseRef } from "@/lib/db/custom-rule";

interface RuleCustomRulesProps {
  ruleSlugs: string[];
}

function RelationGroup({
  label,
  rules,
}: {
  label: string;
  rules: CustomRuleReverseRef[];
}) {
  if (rules.length === 0) return null;
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium">{label}:</span>{" "}
      {rules.map((rule, i) => (
        <span key={rule.id}>
          {i > 0 && ", "}
          <Link href={rule.url} className="underline hover:text-foreground">
            {rule.name}
          </Link>
        </span>
      ))}
    </p>
  );
}

// Runtime-fetched reverse view: community custom rules that replace or augment
// this rule. Fetched on hydration via a server action so the statically
// generated page stays live without a rebuild.
export function RuleCustomRules({ ruleSlugs }: RuleCustomRulesProps) {
  const { data } = useQuery({
    queryKey: ["custom-rules-for-rules", ruleSlugs],
    queryFn: () => getPublicCustomRulesForRules(ruleSlugs),
    enabled: ruleSlugs.length > 0,
  });

  if (!data || (data.replaces.length === 0 && data.augments.length === 0)) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Custom Rules
      </h2>
      <div className="flex flex-col gap-2">
        <RelationGroup label="Replaced by" rules={data.replaces} />
        <RelationGroup label="Augmented by" rules={data.augments} />
      </div>
    </section>
  );
}

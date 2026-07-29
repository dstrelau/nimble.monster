import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { Attribution } from "@/components/shared/Attribution";
import { Badge } from "@/components/ui/badge";
import {
  type CustomRuleReverseRef,
  listPublicCustomRulesForRules,
} from "@/lib/db/custom-rule";
import { RuleSectionHeading } from "./RuleSectionHeading";

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
    <div className="space-y-5">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
        >
          <div className="flex items-center gap-3">
            <Link href={rule.url} className="text-xl font-bold hover:underline">
              {rule.name}
            </Link>
            <Badge variant="secondary">{label}</Badge>
          </div>
          <Attribution user={rule.creator} />
        </div>
      ))}
    </div>
  );
}

export async function RuleCustomRules({ ruleSlugs }: RuleCustomRulesProps) {
  if (ruleSlugs.length === 0) return null;
  const data = await listPublicCustomRulesForRules(ruleSlugs);

  if (data.replaces.length === 0 && data.augments.length === 0) {
    return null;
  }

  const count = new Set(
    [...data.replaces, ...data.augments].map((rule) => rule.id)
  ).size;

  return (
    <section className="mt-10">
      <RuleSectionHeading
        title="Homebrew Rules"
        count={count}
        icon={<NotebookPen className="size-4 stroke-flame" />}
      />
      <div className="space-y-6">
        <RelationGroup label="Replaces" rules={data.replaces} />
        <RelationGroup label="Augments" rules={data.augments} />
      </div>
    </section>
  );
}

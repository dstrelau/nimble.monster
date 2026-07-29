import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { EntityReactions } from "@/components/EntityReactions";
import { ReportEntityDialog } from "@/components/ReportEntityDialog";
import { RuleContent } from "@/components/rules/RuleContent";
import { Attribution } from "@/components/shared/Attribution";
import { auth } from "@/lib/auth";
import type { CustomRule, CustomRuleRelation } from "@/lib/db/custom-rule";
import { findCustomRule } from "@/lib/db/custom-rule";
import { getRule } from "@/lib/rules/filesystem";
import { ruleUrl } from "@/lib/rules/rule-index";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { CustomRuleActions } from "../CustomRuleActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getCustomRule = cache(findCustomRule);

interface RenderedRule {
  ruleSlug: string;
  title: string;
  href: string;
  content: string | null;
}

function getLinkedRules(
  links: CustomRule["links"],
  relation: CustomRuleRelation
): RenderedRule[] {
  return links
    .filter((link) => link.relation === relation)
    .map((link) => {
      const rule = getRule(link.ruleSlug);
      return {
        ruleSlug: link.ruleSlug,
        title: rule?.title ?? link.ruleSlug,
        href: ruleUrl(link.ruleSlug),
        content: rule?.content ?? null,
      };
    });
}

function LinkedRules({
  title,
  rules,
}: {
  title: string;
  rules: RenderedRule[];
}) {
  if (rules.length === 0) return null;
  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex flex-col gap-6">
        {rules.map((rule) => (
          <div key={rule.ruleSlug}>
            <Link
              href={rule.href}
              className="text-base font-semibold hover:underline"
            >
              {rule.title}
            </Link>
            {rule.content && (
              <blockquote className="mt-2 rounded-md border border-border bg-muted/40 px-4 py-3">
                <RuleContent content={rule.content} />
              </blockquote>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  const [rule, session] = await Promise.all([
    uid ? getCustomRule(uid) : null,
    auth(),
  ]);
  if (
    !rule ||
    (rule.visibility === "private" && session?.user?.id !== rule.creator.id)
  )
    return {};
  return { title: `${rule.name} - Custom Rules - ${SITE_NAME}` };
}

export default async function CustomRulePage({ params }: PageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();

  const [rule, session] = await Promise.all([getCustomRule(uid), auth()]);
  if (!rule) notFound();

  const isOwner = session?.user?.id === rule.creator.id;
  if (!isOwner && rule.visibility !== "public") notFound();

  const replaces = getLinkedRules(rule.links, "replaces");
  const augments = getLinkedRules(rule.links, "augments");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/custom-rules" className="hover:text-foreground">
          Custom Rules
        </Link>
        <span>/</span>
        <span className="text-foreground">{rule.name}</span>
      </nav>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{rule.name}</h1>
          <Attribution user={rule.creator} className="mt-2" />
        </div>
        <div className="flex items-center gap-2">
          {isOwner && <CustomRuleActions rule={rule} />}
          <ReportEntityDialog
            entityType="customRule"
            entityId={rule.id}
            entityLabel="Custom Rule"
          />
          <EntityReactions
            entityType="customRule"
            entityId={rule.id}
            showLabel
          />
        </div>
      </div>

      <RuleContent content={rule.content} />

      <LinkedRules title="Replaces" rules={replaces} />
      <LinkedRules title="Augments" rules={augments} />
    </div>
  );
}

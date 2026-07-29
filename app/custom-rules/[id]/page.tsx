import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityReactions } from "@/components/EntityReactions";
import { ReportEntityDialog } from "@/components/ReportEntityDialog";
import { RuleMarkdown } from "@/components/rules/RuleMarkdown";
import { auth } from "@/lib/auth";
import type { CustomRule, CustomRuleRelation } from "@/lib/db/custom-rule";
import { findCustomRule } from "@/lib/db/custom-rule";
import {
  resolveDiceNotationLinks,
  resolveSpellSchoolLinks,
  resolveTermLinks,
} from "@/lib/rules/crosslinks";
import { getRule } from "@/lib/rules/filesystem";
import { ruleUrl } from "@/lib/rules/rule-index";
import { previewMap } from "@/lib/rules/terms";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { CustomRuleActions } from "../CustomRuleActions";
import { CustomRuleBody } from "../CustomRuleBody";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface RenderedRule {
  ruleSlug: string;
  title: string;
  href: string;
  content: string | null;
}

// Resolve a linked official rule through the same crosslink pipeline the rule
// pages use, so embedded rules render identically.
async function renderLinks(
  links: CustomRule["links"],
  relation: CustomRuleRelation
): Promise<RenderedRule[]> {
  return Promise.all(
    links
      .filter((link) => link.relation === relation)
      .map(async (link) => {
        const rule = getRule(link.ruleSlug);
        let content: string | null = null;
        if (rule) {
          const diceResolved = resolveDiceNotationLinks(rule.content);
          const resolved = await resolveSpellSchoolLinks(diceResolved);
          content = resolveTermLinks(resolved);
        }
        return {
          ruleSlug: link.ruleSlug,
          title: rule?.title ?? link.ruleSlug,
          href: ruleUrl(link.ruleSlug),
          content,
        };
      })
  );
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
                <article className="prose dark:prose-invert max-w-none">
                  <RuleMarkdown
                    content={rule.content}
                    previewMap={previewMap}
                  />
                </article>
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
  const rule = uid ? await findCustomRule(uid) : null;
  if (!rule) return {};
  return { title: `${rule.name} - Custom Rules - ${SITE_NAME}` };
}

export default async function CustomRulePage({ params }: PageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();

  const [rule, session] = await Promise.all([findCustomRule(uid), auth()]);
  if (!rule) notFound();

  const isOwner = session?.user?.id === rule.creator.id;
  if (!isOwner && rule.visibility !== "public") notFound();

  const [replaces, augments] = await Promise.all([
    renderLinks(rule.links, "replaces"),
    renderLinks(rule.links, "augments"),
  ]);

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
          <p className="mt-1 text-sm text-muted-foreground">
            by {rule.creator.displayName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EntityReactions entityType="customRule" entityId={rule.id} />
          <div className="flex gap-2">
            {isOwner && <CustomRuleActions rule={rule} />}
            <ReportEntityDialog
              entityType="customRule"
              entityId={rule.id}
              entityLabel="Custom Rule"
            />
          </div>
        </div>
      </div>

      <CustomRuleBody
        content={rule.content}
        creatorDiscordId={rule.creator.discordId}
      />

      <LinkedRules title="Replaces" rules={replaces} />
      <LinkedRules title="Augments" rules={augments} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryIcon } from "@/components/rules/CategoryIcon";
import { RuleCustomRules } from "@/components/rules/RuleCustomRules";
import { RuleMarkdown } from "@/components/rules/RuleMarkdown";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/rules/categories";
import { resolveRuleContent } from "@/lib/rules/crosslinks";
import {
  getAllRules,
  getRule,
  getRuleVariants,
  type RuleSource,
} from "@/lib/rules/filesystem";
import { getRelatedSlugs } from "@/lib/rules/relations";
import {
  ruleUrl,
  variantAnchor,
  variantParentUrl,
} from "@/lib/rules/rule-index";
import { previewMap } from "@/lib/rules/terms";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatSource({ book, pages }: RuleSource): string {
  if (!pages) return `${book} (page unknown)`;
  return `${book} ${pages.length === 1 ? "p." : "pp."} ${pages.join(", ")}`;
}

function RuleSources({ sources }: { sources?: RuleSource[] }) {
  if (!sources) return null;
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium">Source:</span>{" "}
      {sources.map(formatSource).join("; ")}
    </p>
  );
}

export async function generateStaticParams() {
  return getAllRules().map((rule) => ({ slug: rule.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const rule = getRule(slug);
  if (!rule) return {};
  return { title: `${rule.title} - Rules - ${SITE_NAME}` };
}

export default async function RulePage({ params }: PageProps) {
  const { slug } = await params;
  const rule = getRule(slug);
  if (!rule) redirect("/rules");
  if (rule.variantOf) {
    redirect(variantParentUrl(rule.variantOf, rule.slug));
  }

  const category = CATEGORIES.find((c) => c.slug === rule.category);
  const content = await resolveRuleContent(rule.content);
  const variants = await Promise.all(
    getRuleVariants(rule.slug).map(async (variant) => ({
      ...variant,
      resolvedContent: await resolveRuleContent(variant.content),
    }))
  );
  const related = getRelatedSlugs(rule.slug).flatMap((s) => {
    const target = getRule(s);
    if (!target) return [];
    return [
      {
        ...target,
        href: target.variantOf
          ? variantParentUrl(target.variantOf, target.slug)
          : ruleUrl(target.slug),
      },
    ];
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/rules" className="hover:text-foreground">
          Rules
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link
              href={`/rules#${category.slug}`}
              className="flex items-center gap-1.5 hover:text-foreground"
            >
              <CategoryIcon
                icon={category.icon}
                className={cn("size-4", category.color)}
              />
              {category.label}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{rule.title}</span>
      </nav>
      <h1 className="mb-2 text-3xl font-bold">{rule.title}</h1>
      <div className="mb-6">
        <RuleSources sources={rule.sources} />
      </div>
      <article className="prose dark:prose-invert max-w-none">
        <RuleMarkdown content={content} previewMap={previewMap} />
      </article>
      {variants.map((variant) => (
        <section
          key={variant.slug}
          id={variantAnchor(variant.slug)}
          className="mt-10 scroll-mt-20 border-t border-border pt-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-bold">{variant.title}</h2>
            <Badge variant="secondary">Official variant</Badge>
          </div>
          <div className="mb-4">
            <RuleSources sources={variant.sources} />
          </div>
          <article className="prose dark:prose-invert max-w-none">
            <RuleMarkdown
              content={variant.resolvedContent}
              previewMap={previewMap}
            />
          </article>
        </section>
      ))}
      {related.length > 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          <span className="font-medium">Related:</span>{" "}
          {related.map((target, i) => (
            <span key={target.slug}>
              {i > 0 && ", "}
              <Link
                href={target.href}
                className="underline hover:text-foreground"
              >
                {target.title}
              </Link>
            </span>
          ))}
        </p>
      )}
      <RuleCustomRules
        ruleSlugs={[rule.slug, ...variants.map((variant) => variant.slug)]}
      />
    </div>
  );
}

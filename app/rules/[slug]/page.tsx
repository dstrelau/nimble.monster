import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CategoryIcon } from "@/components/rules/CategoryIcon";
import { RuleContent, RuleFaqs } from "@/components/rules/RuleContent";
import { RuleCustomRules } from "@/components/rules/RuleCustomRules";
import { RuleSectionHeading } from "@/components/rules/RuleSectionHeading";
import { RuleSources } from "@/components/rules/RuleSources";
import { Badge } from "@/components/ui/badge";
import { getRuleLocation } from "@/lib/rules/categories";
import { getRuleFaqs } from "@/lib/rules/faqs";
import { getAllRules, getRule, getRuleVariants } from "@/lib/rules/filesystem";
import { getRelatedSlugs } from "@/lib/rules/relations";
import {
  ruleUrl,
  variantAnchor,
  variantParentUrl,
} from "@/lib/rules/rule-index";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";

interface PageProps {
  params: Promise<{ slug: string }>;
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

  const location = getRuleLocation(rule.slug);
  const category = location?.category;
  const variants = getRuleVariants(rule.slug);
  const faqs = getRuleFaqs(rule.slug);
  const variantFaqs = new Map(
    variants.map((variant) => [variant.slug, getRuleFaqs(variant.slug)])
  );
  const allFaqs = [...faqs, ...[...variantFaqs.values()].flat()].filter(
    (item, index, items) =>
      items.findIndex(({ faq }) => faq.slug === item.faq.slug) === index
  );
  const related = getRelatedSlugs(rule.slug).flatMap((s) => {
    const target = getRule(s);
    if (!target) return [];
    const targetLocation = getRuleLocation(target.variantOf ?? target.slug);
    if (!targetLocation) return [];
    return [
      {
        ...target,
        href: target.variantOf
          ? variantParentUrl(target.variantOf, target.slug)
          : ruleUrl(target.slug),
        locationLabel: `${targetLocation.category.label} / ${targetLocation.section.label}`,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav
        className={cn(
          "mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        )}
      >
        <Link href="/rules" className="hover:text-foreground">
          Rules
        </Link>
        {location?.group.slug !== "rules" && (
          <>
            <span>/</span>
            <Link
              href={`/rules#${location?.group.slug}`}
              className="hover:text-foreground"
            >
              {location?.group.label}
            </Link>
          </>
        )}
        {category && category.label !== location?.group.label && (
          <>
            <span>/</span>
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
          </>
        )}
        {location && (
          <>
            <span>/</span>
            <Link
              href={`/rules#${location.section.slug}`}
              className="hover:text-foreground"
            >
              {location.section.label}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{rule.title}</span>
      </nav>
      <div>
        <h1 className="mb-2 text-3xl font-bold">{rule.title}</h1>
        <div className="mb-6">
          <RuleSources sources={rule.sources} />
        </div>
      </div>
      <RuleContent content={rule.content} />
      {variants.length > 0 && (
        <section className="mt-10">
          <RuleSectionHeading
            title="Official Variants"
            count={variants.length}
          />
          <div className="space-y-10">
            {variants.map((variant) => (
              <section
                key={variant.slug}
                id={variantAnchor(variant.slug)}
                className="scroll-mt-20"
              >
                <div>
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">{variant.title}</h3>
                      <Badge variant="secondary">Variant</Badge>
                    </div>
                    <RuleSources
                      sources={variant.sources}
                      className="shrink-0"
                    />
                  </div>
                </div>
                <RuleContent content={variant.content} />
              </section>
            ))}
          </div>
        </section>
      )}
      <RuleFaqs faqs={allFaqs.map(({ faq }) => faq)} />
      {related.length > 0 && (
        <section className="mt-10">
          <RuleSectionHeading title="Related Rules" count={related.length} />
          <div className="space-y-3">
            {related.map((target) => (
              <div
                key={target.slug}
                className="flex flex-wrap items-center gap-2"
              >
                <Link
                  href={target.href}
                  className="text-xl font-bold hover:underline"
                >
                  {target.title}
                </Link>
                <Badge variant="secondary">{target.locationLabel}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
      <Suspense>
        <RuleCustomRules
          ruleSlugs={[rule.slug, ...variants.map((variant) => variant.slug)]}
        />
      </Suspense>
    </div>
  );
}
